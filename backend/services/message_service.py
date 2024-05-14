from dependencies import db
from services.common_service import generate_text
from services.user_services import get_user_details
from fastapi import FastAPI, HTTPException
import logging
from firebase_admin import firestore
from typing import List
from models import Query
from encrypt import encrypt_text, load_key, decrypt_text
from datetime import datetime, timedelta
from services.notif_service import send_fcm_notification
from datetime import datetime, timezone
from services.milvus import find_top_matching_users
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

# Access the encryption key from environment variable
encryption_key = os.getenv('ENCRYPTION_KEY')




logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

key = encryption_key



previous_messages = []

base_prompt = ("You are Nomi,a bot for the Yunomi social application. Whenever any user logs in ensure that. "
               "Engage the user in a lively conversation, ask about their hobbies, what they like doing, who they want to connect with, and whether they're looking for long-term friendships or casual connections. "
               "Remember to keep the conversation engaging and relevant and answer only in short sentences using genz lingo. keep the conversation short")


async def get_or_create_conversation(user_id: str):
    # Try to find an existing conversation for the user with the bot
    conversation_query = db.collection('conversations').where('user_id', '==', user_id).where('bot', '==', True)
    conversations = conversation_query.stream()
    
    # If a conversation exists, return its ID
    for conversation in conversations:
        return {"conversation_id": conversation.id}
    
    # If no conversation exists, create a new one
    new_conversation_ref = db.collection('conversations').document()
    new_conversation_ref.set({
        'user_id': user_id,
        'bot': True,  # This field indicates that this conversation is with the bot
        'created_at': datetime.utcnow().isoformat()
    })
    return {"conversation_id": new_conversation_ref.id}


async def receive_message(message):
    # First, save the user's message
    message_id = save_message(user_id=message.user_id, text=message.text, from_bot=False)
    responses = []      

    # Directly find top matching users for the received message
    async for matched_users in find_top_matching_users(message.text, message.user_id, message_id):
        if matched_users:
            save_message(user_id=message.user_id, text=matched_users["text"], from_bot=True, matched_user_id=matched_users["matched_user_id"], display_name=matched_users["display_name"], profilePic=matched_users["profilePic"])
            responses.append(matched_users)
            print(responses, "final response")


    if not responses:
    # No matches found, inform the user
        user_response = "Hmm, looks like no one is quite like you in this app. I will let you know when we find one."
        save_message(user_id=message.user_id, text=user_response, from_bot=True)
        return [{"text": user_response}]  # Wrap in a list for consistent response structure
    print(responses, "final response")
    return responses



def save_message(user_id, text, from_bot, matched_users=None, **kwargs):

    # Construct the base message document to be saved
    message_data = {
        'conversationId': f"{user_id}_bot",
        'user_id': user_id,  # ID of the user who is receiving this message
        'text': text,  # Text of the message being sent
        'from_bot': from_bot,  # Boolean indicating if this message is from the bot
        'timestamp': datetime.utcnow().isoformat(),  # Timestamp of when the message is saved
        **kwargs  # This adds any additional keyword arguments to message_data

    }
    
    # If there are matched user details, include them in the message data
    if matched_users:
        # Assuming matched_users is a list of dictionaries with 'user_id' and 'original_message_text'
        message_data['matched_users'] = matched_users

    # Save the message in Firestore
    doc_ref = db.collection('messages').add(message_data)
    
    # Return the message ID (document ID)
    return doc_ref[1].id  # doc_ref[1] is the DocumentReference, from which you can get the id


def format_matched_users_response(matched_users):
    # Format the response with user IDs and any necessary message text
    # Assume matched_users is a list of tuples (user_id, original_message_text)
    formatted_response = [{"user_id": user_id, "message": original_message_text} for user_id, original_message_text in matched_users]
    return formatted_response




async def fetch_bot_conversation(user_id: str):
    # Generate the user-bot conversation ID
    conversation_id = f"{user_id}_bot"

    
    # Fetch all messages for the given conversation ID
    messages_query = db.collection('messages').where('conversationId', '==', conversation_id).order_by('timestamp')
    messages = messages_query.stream()

    # Parse the messages into a list
    message_list = [message.to_dict() for message in messages]
    
    # Ensure there are messages to return
    if not message_list:
        raise HTTPException(status_code=404, detail="No conversation found between the user and the bot.")
    
    return {"messages": message_list}


async def get_conversation_id(user1: str, user2: str):
    conversation_query = db.collection('conversations').where('user1', '==', user1).where('user2', '==', user2)
    conversations = conversation_query.stream()

    # If a conversation exists, return its ID
    for conversation in conversations:
        return conversation.id

    return None


async def send_message(request):
    logging.info(f"Received message send request: {request}")
    
    try:
        if request.conversation_id is None:
            if request.is_private and not await check_weekly_limit(request.sender_id, request.receiver_id):
                raise HTTPException(status_code=400, detail="Cannot start a new conversation due to restrictions.")
            conversation_ref = db.collection('conversations').document()
            conversation_ref.set({
                'participants': [request.sender_id, request.receiver_id],
                'is_private': request.is_private,
                'last_message': request.text,
                'last_updated': {
                    request.sender_id: datetime.utcnow(),
                    request.receiver_id: datetime.utcnow()  # Initially set both to the same time when conversation is created
                },
            })
            conversation_id = conversation_ref.id
            logging.info(f"New conversation created with ID: {conversation_id}")
        else:
            conversation_ref = db.collection('conversations').document(request.conversation_id)
            conversation_ref.update({
                f'last_updated.{request.sender_id}': datetime.utcnow(),
                'last_message': request.text,
            })
            conversation_id = request.conversation_id
            logging.info(f"Updated conversation {conversation_id}")

        # Get receiver details
        receiver_details = await get_user_details(request.receiver_id)
        sender_details = await get_user_details(request.sender_id)

        if receiver_details:
            receiver_token = receiver_details.get('fcm_token')
            logging.info(f"Receiver token retrieved: {receiver_token}")
            
            # If receiver details are found, send a FCM notification
            send_fcm_notification(
                receiver_token=receiver_token,
                content=request.text, 
                conversation_id=conversation_id,
                isPrivate=request.is_private,
                sender_id=request.sender_id,               
                sender_display_name=sender_details.get('display_name'),
                sender_username= sender_details.get('username'),
                sender_profilePic=sender_details.get('profilePic'),
                receiver_id=request.receiver_id,
                receiver_display_name=receiver_details.get('display_name'),
                receiver_username= receiver_details.get('username'),
                receiver_profilePic=receiver_details.get('profilePic'),
            )
        else:
            logging.warning("Receiver details not found, notification not sent.")

        # Save the message
        conversation_messages_ref = db.collection('conversations').document(conversation_id).collection('messages')
        conversation_messages_ref.add({
            'user_id': request.sender_id,
            'text': request.text,
            'from_bot': False,
            'timestamp': request.timestamp,
        })
        logging.info(f"Message added to conversation {conversation_id}")

        return {"status": "success", "message": "Message sent successfully", "conversation_id": conversation_id}
    except Exception as e:
        logging.error(f"Error processing send_message request: {e}")
        raise HTTPException(status_code=500, detail=str(e))




async def check_weekly_limit(sender_id, receiver_id):
    print(sender_id, receiver_id)
    sender_details = await get_user_details(sender_id)
    
    # Check mutual likes
    if receiver_id in sender_details.get('user_likes', []):
        receiver_details = await get_user_details(receiver_id)
        if sender_id in receiver_details.get('user_likes', []):
            return True

    # Check premium status
    if sender_details.get('premium', False):
        return True

    # Check the weekly message quota
    last_reset = sender_details.get('last_message_reset')
    current_time = datetime.now(timezone.utc)

    if last_reset is None or (current_time - last_reset) > timedelta(days=7):
        # Reset the message count if a week has passed
        await update_weekly_count(sender_id, 0)  # Assuming this resets the count and last_reset time
        return True

    # Allow sending the message if within the weekly limit
    message_count = sender_details.get('message_count', 0)
    if message_count < 3:
        await update_weekly_count(sender_id, message_count + 1)  # Increment the count
        return True

    return False

async def update_weekly_count(user_id, message_count):
    # Update the user's last_message_reset to the current date/time and reset message_count
    try:
        await db.collection('users').document(user_id).update({
            'last_message_reset': datetime.utcnow(),
            'message_count': message_count
        })
        print(f"Updated weekly count for {user_id}")
    except Exception as e:
        print(f"Error updating weekly count for {user_id}: {e}")


async def get_chat_history(conversationId, isPrivate):
    conversation_ref = db.collection('conversations').document(conversationId)
    conversation_doc = conversation_ref.get()

    if conversation_doc.exists:
        messages_query = conversation_ref.collection('messages').order_by('timestamp', direction=firestore.Query.ASCENDING)
        messages_snapshot = messages_query.get()

        # Extract the message data from the snapshot
        messages = []
        for message in messages_snapshot:
            message_data = message.to_dict()
            message_data['message_id'] = message.id

            # Decrypt text if the conversation is private

            messages.append(message_data)

        return {
            "status": "success",
            "conversation_id": conversationId,
            "messages": messages,
            "is_private": isPrivate
        }
    else:
        # No conversation found with the provided ID
        return {
            "status": "error",
            "message": "No conversation found"
        }

    
async def get_conversations(user_id: str) -> List[dict]:
    conversations_ref = db.collection('conversations')
    conversations_query = conversations_ref.where('participants', 'array_contains', user_id).order_by('last_updated', direction=firestore.Query.DESCENDING)
    conversations_snapshot = conversations_query.get()

    conversations = []
    for conversation in conversations_snapshot:
        conversation_data = conversation.to_dict()
        print(conversation_data, "conversation_data")
        last_message = conversation_data.get('last_message')
        last_updated = conversation_data.get('last_updated')
        participants = conversation_data.get('participants')
        is_private = conversation_data.get('is_private')

        if is_private:
            last_message = decrypt_text(last_message, key)
 
        # Fetch additional details like user names, images, etc.
        participant_details = []
        for participant in participants:
            user_details = await get_user_details(participant)  # Assuming this function exists and works as intended
            if user_details:
                user_details['user_id'] = participant
                participant_details.append(user_details)


        conversation_info = {
            'conversation_id': conversation.id,
            'last_message': last_message,
            'last_updated': last_updated,
            'participants': participant_details,
            'is_private': is_private
        }
        conversations.append(conversation_info)
    print(conversations)

    return conversations

 

def fetch_recent_messages(conversation_id, limit=5):
    # Fetch the last 'limit' messages from the conversation
    recent_messages = db.collection('messages').where('conversationId', '==', conversation_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit).get()
    return [{'user_id': msg.to_dict()['user_id'], 'text': msg.to_dict()['text']} for msg in recent_messages]



async def send_onboarding_message(user_id):

    conversation_id = f"{user_id}_bot"

    onboarding_message = ("Hey there - look who's here, there is someone who likes you over here. "
                          "Now before you start, I wanna tell you, this app is a conversational app where I read through your conversations to understand what you like and what you don’t like. "
                          "This helps me connect you to your kind of people very easily - without wasting time DMing hundreds of people. "
                          "I have kept those conversations also open for the rest of the people who discover you. "
                          "So, your chats are not really private unless you make it. The daily limit of private conversation is only two for now, where no one can see you, including me.")
    
    # Save the onboarding message to the database
    db.collection('messages').add({
        'conversationId': conversation_id,
        'user_id': user_id,
        'text': onboarding_message,
        'from_bot': True,
        'timestamp': datetime.utcnow().isoformat(),
        'type': 'bot'
    })
    # Set the initial conversation state in the conversations collection
    db.collection('conversations').document(conversation_id).set({
        'last_message': onboarding_message,
        'last_updated': datetime.utcnow().isoformat(),
        'conversation_state': 'awaiting_preferences'
    })



async def is_first_time_user(user_id):
    # Query the database for conversations involving this user
    conversations = db.collection('conversations').where('user_id', '==', user_id).get()

    # If there are no conversations, it's the user's first time
    return len(conversations) == 0

async def update_conversation_state(user_id, state, last_message):
    conversation_id = f"{user_id}_bot"

    db.collection('conversations').document(conversation_id).update({
        'last_message': last_message,
        'last_updated': datetime.utcnow().isoformat(),
        'conversation_state': state,
    })
    print("state", state)


async def process_user_preferences(message):
    prompt = (f" You are a bot of this social matching application and the user is stating their preferences. The user says: '{message.text}'. If it is not clear what kind of people user want, only then ask a follow up question. If the user expresses anything similar to that he has nothing else to add, then do not ask any follow up question and tell the user that you have understood. ")
    conversation_id = f"{message.user_id}_bot"

    try:
        query = Query(user_query=prompt)
        response = await generate_text(query)
        generated_response = response['response']


        next_state = await determine_next_state_based_on_response(generated_response)
        print(next_state, "next_state")
        return generated_response, next_state
        
    except Exception as e:
        print(f"Error while fetching response from local LLM: {e}")
        return "Sorry, I couldn't process that. Could you specify a bit more about what you're looking for?", 'awaiting_preferences'


async def process_personal_details(message):
    prompt = f"The user is describing themselves for a social matching application. The user says: '{message.text}'. Based on this, generate a relevant follow-up question or statement:"

    try:
        query = Query(user_query=prompt)
        response = await generate_text(query)
        generated_response = response['response']
        next_state = 'ready_to_match'
        return generated_response, next_state


    except Exception as e:
        print(f"Error while fetching response from local LLM: {e}")
        return "Sorry, I couldn't understand that. Could you tell me a bit more about yourself?", 'awaiting_personal_details'


async def fetch_conversation_state(user_id):
    conversation_id = f"{user_id}_bot"

    try:
        # Fetch the conversation document from Firestore
        conversation_doc = db.collection('conversations').document(conversation_id).get()

        if conversation_doc.exists:
            # Extract the conversation state
            conversation_data = conversation_doc.to_dict()
            res = conversation_data.get('conversation_state', 'default_state')
            print('fetch_conversation_state was called', res)
            return res
        
        
        else:
            # Handle the case where the conversation does not exist
            return 'default_state'
    
    except Exception as e:
        print(f"Error while fetching conversation state: {e}")
        # In case of an error, handle it or default to a safe state
        return 'default_state'


async def determine_next_state_based_on_response(response):
    prompt = (f"The following is a response in a conversation: '{response}'\n"
              "Is this response asking for more specific information or clarification? (Yes or No)")

    try:
        # Use the generate_text function
        query = Query(user_query=prompt)
        llm_response = await generate_text(query)
        answer = llm_response['response'].strip().lower()
        print("answer", answer)

        # Determine the next state based on the LLM's interpretation
        if answer == 'yes':
            return 'awaiting_preferences'
        else:
            return 'awaiting_personal_details'

    except Exception as e:
        print(f"Error while interpreting the response: {e}")
        return 'awaiting_preferences'


async def handle_ready_to_match(message, conversation_id):
    """
    Handle the conversation when it's in the 'ready_to_match' state.
    """
    # For the first time in onboarding, find matching users immediately
    if await is_initial_ready_to_match(message.user_id):
        matched_users = await find_top_matching_users(message.text)
        if not matched_users:
            print("no match found")
            return "Hmm, looks like no one is quite like you in this app. I will let you know when we find one.", 'awaiting_preferences'
        else:
            print(" match found")
            response = "Found some people you might be interested in:\n"
            for user_id, reason in matched_users:
                response += f"User {user_id}: {reason}\n"

        # Update the conversation to indicate matching has been done before
        db.collection('conversations').document(conversation_id).update({'has_matched_before': True})
        next_state = 'awaiting_preferences'
    else:

        # If matching has been done before, check for more specific user preferences
        matched_users = await find_top_matching_users(message.text)
        if not matched_users:
        # Generate a follow-up question using OpenAI
            
            response_text = await generate_follow_up_question(message.text)
            print("generated folow up for matches")
            response = {"response": response_text}
            next_state = 'awaiting_preferences'
        else:
        # Return matched users
            response = {
            "response": "Here are some more people you might like:",
            "userIds": matched_users
            }
            next_state = 'awaiting_preferences'

    return response, next_state


async def is_initial_ready_to_match(user_id):
    """
    Check if this is the first time the conversation state is 'ready_to_match'.
    """
    conversation_id = f"{user_id}_bot"
    conversation_doc = db.collection('conversations').document(conversation_id).get()

    if conversation_doc.exists:
        conversation_data = conversation_doc.to_dict()
        # Check if the 'has_matched_before' field exists and is True
        return not conversation_data.get('has_matched_before', False)
    else:
        # If the conversation doesn't exist, treat it as the initial 'ready_to_match'
        return True

async def generate_follow_up_question(user_message):
    """
    Generate a follow-up question based on the user's message using the locally running Mistral LLM.
    """
    try:
        prompt = (f"A {user_message}'. "
                  "Generate a relevant follow-up question to better understand their preferences:")

        # Sending the prompt to your local LLM via FastAPIuser in a social matching application has said: '

        query = Query(user_query=prompt)
        response = await generate_text(query)
        generated_response = response['response']
        return generated_response


    except Exception as e:
        print(f"Error while generating follow-up question: {e}")
        return "Could you tell me a bit more about what you're looking for?"



async def fetch_conversation_history(conversation_id, limit=10):
    """
    Fetch and format the history of the conversation for the given user.
    """
    messages = db.collection('messages').where('conversationId', '==', conversation_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit).get()

    
    # Format the messages into a conversation context string
    conversation_context = "\n".join(
        [f"{'Bot' if msg.to_dict().get('from_bot') else 'User'}: {msg.to_dict().get('text')}" for msg in messages]
    )
    return conversation_context
