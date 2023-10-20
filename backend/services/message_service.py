from datetime import datetime
import openai
from dependencies import db
from services.common_service import find_conversation
from fastapi import FastAPI, HTTPException
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



openai.api_key = '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'

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
    # Generate the user-bot conversation ID
    conversation_id = f"{message.user_id}_bot"
    print(f"Generated conversation_id: {conversation_id}")

    # Save the user's message
    db.collection('messages').add({
        'conversationId': conversation_id,
        'user_id': message.user_id,
        'text': message.text,
        'from_bot': False,
        'timestamp': datetime.utcnow().isoformat()
    })

    previous_messages.append({"role": "User", "content": message.text})
    dynamic_prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in previous_messages]) + "\nNomi: "

    # Combine them for the final prompt
    prompt = base_prompt + "\n\n" + dynamic_prompt

    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=prompt,
            temperature=0.6,
            max_tokens=150
        )
        next_message = response.choices[0].text.strip()
    except Exception as e:
        next_message = "Sorry, I couldn't process that request."
        # Optionally, log the exception details for debugging:
        print(f"Error while fetching response from OpenAI: {e}")

    # Save the bot's message
    db.collection('messages').add({
        'conversationId': conversation_id,
        'user_id': message.user_id,
        'text': next_message,
        'from_bot': True,
        'timestamp': datetime.utcnow().isoformat()
    })

    # Update the last message and timestamp for the conversation
    # Optional: You can decide if you want to maintain this 'conversations' collection
    db.collection('conversations').document(conversation_id).set({
        'last_message': next_message,
        'last_updated': datetime.utcnow().isoformat()
    })

    return {"response": next_message}

async def fetch_bot_conversation(user_id: str):
    # Generate the user-bot conversation ID
    conversation_id = f"{user_id}_bot"
    print(f"Generated conversation_id: {conversation_id}")

    
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

def send_message(request):
    conversation_id = find_conversation(request.sender_id, request.receiver_id)
    if conversation_id is None:
        conversation_ref = db.collection('conversations').document()
        conversation_ref.set({
            'participants': [request.sender_id, request.receiver_id],
            'type': 'human',
            'last_message': request.text,
            'last_updated': datetime.utcnow().isoformat(),
            'likes': 0
        })
        conversation_id = conversation_ref.id
    else:
        db.collection('conversations').document(conversation_id).update({
            'last_message': request.text,
            'last_updated': datetime.utcnow().isoformat()
        })

    db.collection('conversations').document(conversation_id).collection('messages').add({
        'user_id': request.sender_id,
        'text': request.text,
        'from_bot': False,
        'timestamp': datetime.utcnow().isoformat()
    })

    return {"status": "success", "message": "Message sent successfully", "conversation_id": conversation_id}
