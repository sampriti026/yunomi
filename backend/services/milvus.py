from pymilvus import MilvusClient
from openai import AsyncOpenAI
import asyncio
import json
import os
from dependencies import db

# Initialize Firebase Admin SDK

CLUSTER_ENDPOINT = os.getenv('CLUSTER_ENDPOINT')
TOKEN = os.getenv('TOKEN')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


CLUSTER_ENDPOINT=CLUSTER_ENDPOINT
TOKEN=TOKEN


openai = AsyncOpenAI(
    api_key=OPENAI_API_KEY
)

# Initialize a MilvusClient instance
client = MilvusClient(
    uri=CLUSTER_ENDPOINT, # Cluster endpoint obtained from the console
    token=TOKEN # API key or a colon-separated cluster username and password
)    

async def get_user_details(user_id: str) -> dict:
    """
    Fetches user details given a user ID.
    """
    print(f"Fetching details for user_id: {user_id}")  # Debugging log
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    if user_doc.exists:
        user_detail = user_doc.to_dict()
        print("user_detail", user_detail)
        return user_detail
    else:
        print(f"No user found for user_id: {user_id}")  # Debugging log
    return {}


async def find_top_matching_users(original_prompt, current_user_id, current_message_id):

    # Generate embedding for the original message using openai
    response = await openai.embeddings.create(
    input=original_prompt,
    model="text-embedding-3-small"
    )

    # Ensure the embedding is appropriately shaped
    original_embedding = response.data[0].embedding

    data = [
    {"message_id": current_message_id, "vector": original_embedding, "user_id": current_user_id},
    ]

    res = client.insert(
    collection_name="prompts",
    data=data
   )
    #search for the closest similarity in bulk filtering the userId that are not the same as the one who prompted
    ser = client.search(
    search_params = {
    'params':{
    'metric_type': 'COSINE',
        }
    },
    collection_name="prompts",
    data=[original_embedding],
    filter=f'user_id != "{current_user_id}"',
    limit=3,
    output_fields=["user_id"])

    if not ser or all(not x for x in ser):
        yield {"text": "Hmm, looks like there's no perfect match right now. Why not explore and try connecting with someone new in the meantime?"}

    # Collect user_ids and associated message_ids from each sublist
    user_messages = {}
    for sublist in ser:
        for message in sublist:
            user_id = message['entity']['user_id']
            message_id = message['id']
            if user_id in user_messages:
                user_messages[user_id].add(message_id)
            else:
                user_messages[user_id] = {message_id}

    # Find common user_ids across both sublists
    common_user_ids = set(user_messages.keys())
    # Collect all message_ids associated with the common user_ids
    common_user_messages = {user_id: list(message_ids) for user_id, message_ids in user_messages.items() if user_id in common_user_ids}


    for user_id, message_ids in common_user_messages.items():
        combined_text = ""
        user_detail = await get_user_details(user_id)
        display_name = user_detail.get("display_name", "Unknown")
        all_texts = []
        for message_id in message_ids:
            # Perform a query to fetch the message
            
            message_snapshot = db.collection('messages').document(message_id).get()
            
            if message_snapshot.exists:
                message_data = message_snapshot.to_dict()
                all_texts.append(message_data.get('text', ''))
            else:
                print(f"No message found with ID {message_id}")
        
        # below variable combines all the texts of all the users altogether, which shudnt happen
        combined_text = " ".join(all_texts)
        prompt = f"""
        You are a social bot tasked with introducing users to each other based on their text messages. 
        You need to introduce me to a user named {display_name}. Describe {display_name}'s qualities and interests to me, using the information found in {display_name}'s text messages. Ensure the introduction is brief and direct, without greetings or additional formatting.
        Only use the pronoun they/them when introducing me to {display_name}
        If the text messages suggest that {display_name} may not fully meet my original request, still introduce {display_name} by highlighting any interesting aspects that might catch my interest, despite not being the ideal match.
        Text messages from {display_name}: {combined_text}
        """
        openai_message = [
        {"role": "system", "content": f"{prompt}"},
        {"role": "user", "content": f"{original_prompt}"}
        ]

        summary_response = await openai.chat.completions.create(
            model="gpt-4o",
            messages=openai_message,
            max_tokens=150
        )
        response = {
            "text": summary_response.choices[0].message.content,  
            "matched_user_id": user_id,
            "display_name": display_name,
            "profilePic": user_detail.get("profilePic", 'https://via.placeholder.com/150/FF0000/FFFFFF?text=User')
        }
        yield response


