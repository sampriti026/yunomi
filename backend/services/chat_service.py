from datetime import datetime
from dependencies import db


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
