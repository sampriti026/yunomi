from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import openai
from pydantic import BaseModel
from datetime import datetime


openai.api_key = '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'


# Initialize Firebase Admin SDK
cred = credentials.Certificate('yunomi026-firebase-adminsdk-b9dts-7aeacab137.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

class Message(BaseModel):
    user_id: str
    text: str

def is_first_time_user(user_id: str) -> bool:
    """Check if the user is logging in for the first time and has answered most questions."""
    user_data = db.collection('users').document(user_id).get()
    if user_data.exists:
        return user_data.get("first_time") and user_data.get("questions_answered")
    else:
        return False
    
def update_user_status(user_id: str):
    """Update the user's first_time status to False."""
    db.collection('users').document(user_id).update({"first_time": False})


@app.post("/start_conversation")
async def start_conversation(message: Message):
    # Check if the user is logging in for the first time
    if not is_first_time_user(message.user_id):
        return {"status": "failure", "reason": "User has logged in before"}

    # Options for the user
    options = [
        "want to make friends",
        "just bored",
        "im curious about people"
    ]
    
    return {"status": "success", "prompt": "Why are you here?", "options": options}

base_prompt = ("You are Nomi,a bot for the Yunomi social application. Whenever any user logs in ensure that. "
               "Engage the user in a lively conversation, ask about their hobbies, what they like doing, who they want to connect with, and whether they're looking for long-term friendships or casual connections. "
               "Remember to keep the conversation engaging and relevant and answer only in short sentences using genz lingo. keep the conversation short")

previous_messages = []  # This will store the conversation history. You can fetch this from Firebase for a more extended history if needed.

@app.post("/get_or_create_conversation")
async def get_or_create_conversation(user_id: str):
    # Try to find an existing conversation for the user with the bot
    conversation_query = db.collection('conversations').where('user_id', '==', user_id).where('bot', '==', True)
    conversations = conversation_query.stream()
    
    # If a conversation exists, return its ID
    for conversation in conversations:
        return {"conversation_id": conversation.id}
    
    # If no conversation exists, create a new one
    new_conversation_ref = db.collection('conversations').add({
        'user_id': user_id,
        'bot': True,  # This field indicates that this conversation is with the bot
        'created_at': datetime.utcnow().isoformat()
    })
    return {"conversation_id": new_conversation_ref.id}


@app.post("/receive_message")
async def receive_message(conversation_id: str, message: Message):
    # Save the user's message to Firebase under the specific conversation
    db.collection('conversations').document(conversation_id).collection('messages').add({
        'user_id': message.user_id,
        'text': message.text,
        'from_bot': False,
        'timestamp': datetime.utcnow().isoformat()  # Store timestamp as ISO string
    })

    # Update the last message and last updated time in the conversation document
    db.collection('conversations').document(conversation_id).update({
        'last_message': message.text,
        'last_updated': datetime.utcnow().isoformat()
    })


    # Update the previous messages to include the user's message
    previous_messages.append({"role": "User", "content": message.text})
    
    dynamic_prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in previous_messages]) + "\nNomi: "

    # Combine them for the final prompt
    prompt = base_prompt + "\n\n" + dynamic_prompt

    # Make a request to OpenAI
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=prompt,
        temperature=0.6,
        max_tokens=150  # Limit the response length
    )

    # Extract the bot's message from the response
    next_message = response.choices[0].text.strip()

    # Save this message to the previous_messages list and Firebase
    previous_messages.append({"role": "Nomi", "content": next_message})
    db.collection('messages').add({
        'user_id': message.user_id,
        'text': next_message,
        'from_bot': True,
        'timestamp': datetime.utcnow().isoformat()  # Store timestamp as ISO string
    })

    return {"response": next_message}


class Post(BaseModel):
    user_id: str
    content: str
    display_name: str  # New
    profile_pic_uri: str  # New

@app.post("/send_post")
async def send_post(post: Post):
    try:
        post_data = {
            "user_id": post.user_id,
            "content": post.content,
            "display_name": post.display_name,  # Save display_name
            "profile_pic_uri": post.profile_pic_uri,  # Save profile_pic_uri
            "likes_count": 0,  # Initialize with zero likes
            "likers": [],  # Initialize with empty list of likers
            "timestamp": datetime.utcnow().isoformat()  # Add a timestamp for the post
        }
        # Add the post to Firestore
        db.collection('posts').add(post_data)
        return {"status": "success", "message": "Post added successfully"}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"status": "failure", "message": "An error occurred while adding the post"}

def get_user_info(user_id: str):
    """Fetch user's basic info like display name and profile picture."""
    user_data = db.collection('users').document(user_id).get()
    if user_data.exists:
        return {
            "display_name": user_data.get("name"),
            "profile_pic_uri": user_data.get("profile_pic_uri")
        }
    else:
        return None
    
@app.get("/get_post/{post_id}")
async def get_post(post_id: str):
    try:
        post_data = db.collection('posts').document(post_id).get()
        if post_data.exists:
            return {"status": "success", "data": post_data.to_dict()}
        else:
            return {"status": "failure", "message": "Post not found"}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"status": "failure", "message": "An error occurred while fetching the post"}

@app.post("/like_post")
async def like_post(post_id: str, user_id: str):
    try:
        post_ref = db.collection('posts').document(post_id)
        post_data = post_ref.get()

        if post_data.exists:
            likers = post_data.get("likers") or []
            if user_id not in likers:
                likers.append(user_id)
                post_ref.update({"likers": likers, "likes_count": len(likers)})
            return {"status": "success", "message": "Post liked successfully"}
        else:
            return {"status": "failure", "message": "Post not found"}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"status": "failure", "message": "An error occurred while liking the post"}
    

def view_liked_users(conversation_id):
    """
    View users who liked a conversation.
    """
    likes_ref = db.collection('conversations').document(conversation_id).collection('likes')
    liked_users = likes_ref.stream()
    return [user.id for user in liked_users]


@app.post("/like_conversation")
async def like_conversation(user_id: str, conversation_id: str):
    conversation_ref = db.collection('conversations').document(conversation_id)
    likes_ref = conversation_ref.collection('likes').document(user_id)

    # Use a transaction to ensure atomicity
    @firestore.transactional
    def update_likes(transaction, conversation_ref, likes_ref):
        likes_snapshot = likes_ref.get(transaction=transaction)
        if not likes_snapshot.exists:
            transaction.update(conversation_ref, {
                'likes': firestore.Increment(1)
            })
            transaction.set(likes_ref, {
                'liked_at': datetime.utcnow().isoformat()
            })

    update_likes(conversation_ref, likes_ref)


class SendMessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    text: str


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


@app.post("/send_message")
async def send_message(request: SendMessageRequest):
    # Find existing conversation or start a new one
    conversation_id = find_conversation(request.sender_id, request.receiver_id)
    if conversation_id is None:
        # Start a new conversation
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
        # Update the last message and last updated time in the existing conversation document
        db.collection('conversations').document(conversation_id).update({
            'last_message': request.text,
            'last_updated': datetime.utcnow().isoformat()
        })

    # Add the message to the messages sub-collection under the conversation document
    db.collection('conversations').document(conversation_id).collection('messages').add({
        'user_id': request.sender_id,
        'text': request.text,
        'from_bot': False,
        'timestamp': datetime.utcnow().isoformat()
    })

    return {"status": "success", "message": "Message sent successfully", "conversation_id": conversation_id}



def fetch_latest_chats(user_id):
    """
    Fetch the latest chats for a user.
    """
    try:
        conversations_ref = db.collection('conversations').where('participants', 'array_contains', user_id)
        conversations = conversations_ref.stream()
        chat_list = []
        for conversation in conversations:
            conversation_data = conversation.to_dict()
            last_message = conversation_data['last_message']
            last_updated = conversation_data['last_updated']
            
            # Convert last_updated to datetime object if it's a string
            if isinstance(last_updated, str):
                last_updated = datetime.fromisoformat(last_updated)
            
            other_participant = next((p for p in conversation_data['participants'] if p != user_id), None)
            
            if other_participant:
                user_ref = db.collection('users').document(other_participant)
                user = user_ref.get()
                if user.exists:
                    user_data = user.to_dict()
                    chat_list.append({
                        'id': user_ref.id,
                        'name': user_data['displayname'],
                        'username': user_data['username'],
                        'dp': user_data['profilepicurl'],
                        'lastMessage': last_message,
                        'date': last_updated.strftime('%b %d, %Y %H:%M:%S')
                    })
        return chat_list
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

@app.get("/get_latest_chats")
async def get_latest_chats(user_id: str):
    chats = fetch_latest_chats(user_id)
    return chats



# You can run the FastAPI application with Uvicorn:
# `uvicorn bot:app --reload`
