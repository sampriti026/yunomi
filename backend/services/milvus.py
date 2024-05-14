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
    print(res)

    #get embeddings for the previous prompts of current_user_id
    embed = client.query(
    collection_name="prompts",
    filter=f'user_id == "{current_user_id}"',
    limit=3    )
    vector = embed[0]['vector']

    #search for the closest similarity in bulk filtering the userId that are not the same as the one who prompted
    ser = client.search(
    collection_name="prompts",
    data=[original_embedding],
    filter=f'user_id != "{current_user_id}"',
    limit=3,
    output_fields=["user_id"]    )
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
    common_user_ids = set(user_messages.keys()).intersection([message['entity']['user_id'] for sublist in ser for message in sublist])

    # Collect all message_ids associated with the common user_ids
    common_user_messages = {user_id: list(message_ids) for user_id, message_ids in user_messages.items() if user_id in common_user_ids}

    print(common_user_messages)

    all_texts = []
    for user_id, message_ids in common_user_messages.items():
        print(f"User ID: {user_id}")
        user_detail = await get_user_details(user_id)
        display_name = user_detail.get("display_name", "Unknown")

        for message_id in message_ids:
            # Perform a query to fetch the message
            message_snapshot = db.collection('messages').document(message_id).get()
            
            if message_snapshot.exists:
                message_data = message_snapshot.to_dict()
                all_texts.append(message_data.get('text', ''))
            else:
                print(f"No message found with ID {message_id}")

        combined_text = " ".join(all_texts)
        print(combined_text)

        summary_response = await openai.completions.create(
        model="gpt-3.5-turbo-instruct",
        prompt=f"You're a social bot whose role is to introduce other users based on their text messages. You are introducing me to {display_name}. Based on the text messages of {display_name}, write a short, direct and concise message explaining me about {display_name}. Focus solely on their qualities and interests based on their text messages I have attached. Remember, use {display_name}'s name directly, avoid any apostrophes, and do not insert placeholders or additional text formatting. Do not use any greetings. The text messages of {display_name}:{combined_text}. My prompt: {original_prompt}. Eg of a person A: 'A is interested in chess and is 21 years old. You should connect.'",
        max_tokens=150
        )
        response = {
        "text": summary_response.choices[0].text.strip(),  
        "matched_user_id": user_id,
        "display_name": display_name,
        "profilePic": user_detail.get("profilePic", 'https://via.placeholder.com/150/FF0000/FFFFFF?text=User')
        }
        print(response)
        yield response



# Run the asynchronous function
if __name__ == "__main__":
    asyncio.run(find_top_matching_users())
