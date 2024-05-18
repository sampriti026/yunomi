from dependencies import db
from datetime import datetime
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import openai
import requests
from fastapi import FastAPI, HTTPException
import json
import httpx
from openai import AsyncOpenAI
import firebase_admin
from firebase_admin import credentials, firestore






client = AsyncOpenAI(
    api_key='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',
)


async def generate_text(input_data):
    try:

        constructed_prompt = f"""
        You are a matchmaker. Based on the user_prompt and message, decide whether it seems the user might be interested in talking to the sender. Output only 'yes' or 'no'. Do NOT answer the question.
        Few shot examples
        user_prompt: "hey i played pretty bad football today and i feel like crying, anyone i can talk to?"
        message: "i am interested in connecting with people who play football"
        output: "yes"

        user_prompt: "I'm looking for someone to discuss classic literature with, especially 19th-century novels."
        message: "I love discussing recent movies and TV shows!"
        output: "no"

        user_prompt: "I am a 16 year old girl and I want to talk to other girls who are interested in coding."
        message: "I am 19F and my interests include wriitng and coding."
        output: "yes"
    
        user_prompt: "I 
        user_prompt: "{input_data['user_prompt']}"
        message: "{input_data['message']}"
        output:
        """.strip()


        
        # Send the user query to the LLM
        r = requests.post('http://localhost:11434/api/generate',
                          json={
                              'model': "mistral",
                              'prompt': constructed_prompt,
                              'system': "You are a matchmaker. You ONLY output in 'yes' or 'no'. Do NOT answer the question."
                          },
                          )
        r.raise_for_status()

        # Process the response
        response = ''
        for line in r.iter_lines():
            body = json.loads(line)
            response += body.get('response', '')
            if 'error' in body:
                print(f"LLM Error: {body['error']}")
                raise Exception(body['error'])

            if body.get('done', False):
                # Additional data can be processed or logged here
                break

        return {
            "response": response,
        }

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")  # HTTP error
    except requests.exceptions.ConnectionError as conn_err:
        print(f"Error Connecting: {conn_err}")  # Connection error
    except requests.exceptions.Timeout as timeout_err:
        print(f"Timeout Error: {timeout_err}")  # Timeout error
    except requests.exceptions.RequestException as req_err:
        print(f"Request Error: {req_err}")  # Ambiguous request error
    except Exception as e:
        print(f"Error while fetching response from local LLM: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def find_conversation(participant1, participant2):
    """
    Find a conversation between two participants.
    """
    conversations_ref = db.collection('conversations')
    conversations = conversations_ref.where('participants', 'array_contains', participant1).stream()
    for conversation in conversations:
        participants = conversation.to_dict().get('participants', [])
        if participant2 in participants:
            return conversation.id
    return None

async def find_conversation_with_type(participant1, participant2, is_private):
    """
    Asynchronously find a conversation between two participants with a specific privacy setting.
    """
    conversations_ref = db.collection('conversations')
    query = conversations_ref \
        .where(field_path='participants', op_string='array_contains', value=participant1) \
        .where(field_path='is_private', op_string='==', value=is_private)
    
    try:
        conversations = query.get()  # This should be awaited, and it returns an awaitable object
        for conversation in conversations:
            conversation_data = conversation.to_dict()
            participants = conversation_data.get('participants', [])
            if participant2 in participants:
                print(conversation.id)
                return conversation.id
    except Exception as e:
        print(f"Error retrieving or processing conversations: {e}")
        return None
    print(conversation.id)

    return None



async def generate_embedding(text):
    try:
        async with httpx.AsyncClient() as client:
            embedding_response = await client.post(
                "http://127.0.0.1:8000/get_embedding/",
                json={"text": text}
            )
        
        embedding_response.raise_for_status()
        embedding = np.array(embedding_response.json()[0])  # Extract the first embedding vector
        return embedding
    except httpx.HTTPStatusError as e:
        print(f"HTTP error generating embedding: {e}")
    except httpx.RequestError as e:
        print(f"Request error generating embedding: {e}")
    return np.array([])  # Return an empty array as a fallback


def is_same_topic(embedding1, embedding2, threshold=0.7):
    similarity = cosine_similarity([embedding1], [embedding2])[0][0]
    return similarity > threshold

async def generate_contextual_embedding(conversation_id, user_id, new_message, recent_context):
    if not new_message:
        return None

    # Combine new message with recent context
    combined_text = " ".join([msg['text'] for msg in recent_context]) + " " + new_message
    print(combined_text, "combined_text")
    
    # Generate the contextual embedding for the combined text
    contextual_embedding = await generate_embedding(combined_text)
    print("contextual_embedding", contextual_embedding)

    # Store in Firestore
    embedding_doc = {
        'conversationId': conversation_id,
        'user_id': user_id,
        'embedding': contextual_embedding.tolist(),  # Convert NumPy array to list
        'timestamp': datetime.utcnow().isoformat()
    }
    db.collection('embeddings').document().set(embedding_doc)


# async def generate_hypothetical_message(user_prompt):
#     try:
#         prompt = f"You are a bot tasked to find other users based on the prompt: {user_prompt}. Write a message that ideally that user would say."

#         # Sending the prompt to your local LLM via FastAPI
    
#         # Use the generate_text function
#         response = await generate_text(prompt)
#         generated_response = response['response']
#         print("generated_response", generated_response)

#         return generated_response
#     except Exception as e:
#         print(f"Error while generating hypothetical message: {e}")
#         return "Sorry, I couldn't generate a message based on that prompt."



async def validate_user_match(message, user_prompt):
    try:
        input_data = {
            'user_prompt': user_prompt,
            'message': message
        }

        # Sending the prompt to your local LLM via FastAPI
        # Use the generate_text function
        llm_response = await generate_text(input_data)
        response_text = llm_response['response'].strip().lower()
        print("answer", response_text)
        is_affirmative = "yes" in response_text
        return is_affirmative
    except Exception as e:
        print(f"Error in validate_user_match: {e}")
        return False




# async def detect_connection_request(message_text):
#     # Define a prompt for the GPT model to interpret the intention of the message
#     prompt = (f"The following message is from a user of a social networking app: '{message_text}'\n"
#               "Is the user looking to connect with someone else or trying to find someone else? (Yes or No)")

#     try:
#         # Use OpenAI GPT to interpret the intention
#         response = openai.Completion.create(
#             model="text-davinci-003",
#             prompt=prompt,
#             max_tokens=10
#         )
#         # Interpret the response
#         answer = response.choices[0].text.strip().lower()
#         return answer == 'yes'
#     except Exception as e:
#         print(f"Error while interpreting the message intention: {e}")
#         return False  # In case of error, default to False or handle as needed
async def find_top_matching_users(original_prompt, current_user_id, current_message_id):

    # Generate embedding for the original message using local FastAPI
    async with httpx.AsyncClient() as client:
        embedding_response = await client.post(
            "http://127.0.0.1:8000/get_embedding/",
            json={"text": original_prompt}
        )
        
    
    embedding_response.raise_for_status()
    # Ensure the embedding is appropriately shaped
    original_embedding = np.array(embedding_response.json())

    if original_embedding.ndim == 2 and original_embedding.shape[0] == 1:
        original_embedding = original_embedding.reshape(-1)
    elif original_embedding.ndim > 2:
        # Additional handling if the array is more than two-dimensional
        original_embedding = original_embedding.reshape(-1)

    save_embedding(original_embedding, current_message_id, current_user_id)

    # Fetch all embeddings from Firestore
    embeddings_docs = db.collection('embeddings').get()
    all_embeddings = [
        (doc.id, doc.to_dict()['user_id'], np.array(doc.to_dict()['embedding'], ndmin=1))
        for doc in embeddings_docs if doc.to_dict()['user_id'] != current_user_id
    ]

    # Calculate cosine similarity with each embedding
    similarities = [
    (message_id, user_id, cosine_similarity([original_embedding], [embedding])[0][0])
    for message_id, user_id, embedding in all_embeddings
    ]

    # Filter and sort similarities
    similarities_above_threshold = [sim for sim in similarities if sim[2] > 0.70]
    top_ten_similarities = sorted(similarities_above_threshold, key=lambda x: x[2], reverse=True)[:3]


    top_matched_users = []
    # Fetch message texts for top matches, assuming direct fetch without validation here
    for message_id, user_id, _ in top_ten_similarities:
        message_doc = db.collection('messages').document(message_id).get()
        message_text = message_doc.to_dict().get('text', 'No message found') if message_doc.exists else 'No message found'
        top_matched_users.append((user_id, message_text))

    print('top_matched_users', top_matched_users)
    if not top_matched_users:
        print("No matching users found.")
        return []

    return top_matched_users

def save_embedding(embedding, message_id, user_id):
    # Prepare the document to be saved in the 'embeddings' collection
    embedding_doc = {
        'user_id': user_id,
        'embedding': embedding.tolist()  # Convert numpy array to list for Firestore compatibility
    }
    # Save the document using the message ID as the document ID
    db.collection('embeddings').document(message_id).set(embedding_doc)
    print(f"Embedding saved for message ID: {message_id}")


def truncate_embedding(embedding, new_length):
    return embedding[:new_length]

async def update_embeddings_with_messages():
    print("Starting to update embeddings for public messages")
    
    # Assuming each conversation has a subcollection named 'messages'
    # and each message document within this subcollection has a 'type' field
    conversations = db.collection('conversations').stream()

    async with httpx.AsyncClient() as client:
        for conversation in conversations:
            # Fetch all 'public' messages within this conversation
            public_messages = db.collection(f'conversations/{conversation.id}/messages') \
                                .where('type', '==', 'public') \
                                .stream()

            for msg in public_messages:
                message_text = msg.to_dict().get('text')
                message_id = msg.id
                user_id = msg.to_dict().get('user_id')
                print("Processing message ID:", message_id)
                
                # Generate embedding for the message
                try:
                    embedding_response = await client.post(
                        "http://127.0.0.1:8000/get_embedding/",
                        json={"text": message_text}
                    )
                    embedding_response.raise_for_status()
                    embedding = embedding_response.json()

                    # Check if the embedding is nested and flatten if necessary
                    if isinstance(embedding[0], list):
                        embedding = [item for sublist in embedding for item in sublist]

                    # Update or create a document in 'embeddings' collection
                    embedding_doc = {
                        'message_id': message_id,
                        'user_id': user_id,
                        'embedding': embedding
                    }
                    db.collection('embeddings').document(message_id).set(embedding_doc)
                    print("Embedding updated for message ID:", message_id)
                
                except Exception as e:
                    print(f"Error while updating embedding for message ID {message_id}: {e}")

    print("Done updating embeddings for public messages")



