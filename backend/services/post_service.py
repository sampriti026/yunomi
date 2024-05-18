from datetime import datetime
from dependencies import db
from services.user_services import get_user_details
from fastapi import HTTPException
from firebase_admin import firestore
from services.common_service import find_conversation_with_type
from services.notif_service import send_like_notification, send_reply_post_notification
from services.message_service import check_weekly_limit
from google.cloud.firestore import Increment
from firebase_admin import firestore
from datetime import datetime
from models import Post



def send_post(post: Post):
    try:
        # Initialize post_data with fields that are common to both reposts and direct posts
        post_data = post.dict(include={
            'user_id',
            'timestamp',
            'repost',
            'likes',
            'liked_by',
            'reply_count',
            'replies'
        })

        if post.repost:
            # Ensure messageId and conversationId are included for reposts
            post_data.update({
                'messageId': post.message_id,
                'conversationId': post.conversationId
            })
        else:
            # Include content for direct posts
            post_data['content'] = post.content

        # Create a new document in the 'posts' collection
        post_ref = db.collection('posts').document()
        post_ref.set(post_data)
        
        return {"status": "success", "post_id": post_ref.id}
    except Exception as e:
        print(f"Error adding post: {e}")
        return {"status": "error", "message": str(e)}



def like_post(post_id: str, user_id: str):
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

async def toggle_like(post_id: str, user_id: str):
    try:
        post_ref = db.collection('posts').document(post_id)
        post_doc = post_ref.get()
        if post_doc.exists:
            post_data = post_doc.to_dict()
            liked_by = post_data.get('liked_by', [])
            post_owner_id = post_data.get('user_id')
            print(post_owner_id, "post_owner_id", user_id, "user")
            if user_id in liked_by:
                # User already liked the post, unlike it
                liked_by.remove(user_id)
                new_likes = post_data.get('likes', 1) - 1  # Ensure likes cannot go below 0
            else:
                # User hasn't liked the post, like it
                liked_by.append(user_id)
                new_likes = post_data.get('likes', 0) + 1
                user_details = await get_user_details(user_id)
                post_owner_details= await get_user_details(post_owner_id)
                if post_owner_id != user_id:  # Avoid sending notification if the user likes their own post
                    print("asdf")
                    send_like_notification(
                        receiver_token= post_owner_details.get('fcm_token'),
                        post_id = post_id,
                        user_id=user_id, 
                        username= user_details.get('username'), 
                        display_name = user_details.get('display_name'),
                        profilePic= user_details.get('profilePic'), 
                        post_content=post_data.get('content')
                    )

            # Update the post document
            post_ref.update({'liked_by': liked_by, 'likes': new_likes})
            return {"status": "success", "likes": new_likes}
        else:
            return {"status": "error", "message": "Post not found"}
    except Exception as e:
        print(f"Error toggling like: {e}")
        return {"status": "error", "message": str(e)}

def get_like_count(post_id: str):
    try:
        post_ref = db.collection('posts').document(post_id)
        post_doc = post_ref.get()
        if post_doc.exists:
            post_data = post_doc.to_dict()
            like_count = post_data.get('likes', 0)  # Default to 0 if not found
            return {"status": "success", "like_count": like_count}
        else:
            return {"status": "error", "message": "Post not found"}
    except Exception as e:
        print(f"Error fetching like count: {e}")
        return {"status": "error", "message": str(e)}





async def fetch_posts():
    try:
        posts_ref = db.collection('posts').order_by('timestamp', direction=firestore.Query.DESCENDING)
        posts = posts_ref.stream()

        result = []
        for post in posts:
            post_data = post.to_dict()
            post_id = post.id
            post_userId = post_data['user_id']
            

            user_details = await get_user_details(post_data['user_id'])
            
            if post_data.get('repost'):
                # Adjusted path to fetch the original post from the messages subcollection of conversations
                conversation_ref = db.collection('conversations').document(post_data['conversationId'])
                message_ref = conversation_ref.collection('messages').document(post_data['messageId'])
                
                original_message = message_ref.get()
                if original_message.exists:
                    original_message_data = original_message.to_dict()
                    reposted_user_details = await get_user_details(original_message_data['user_id'])
                    
                    # Append the fetched data to the result list
                    result.append({
                        "postId": post_id,
                        "post_userId": post_userId,
                        "displayname": user_details.get('display_name', ''),
                        "text": original_message_data.get('text', ''),
                        "timestamp": post_data.get('timestamp', ''),
                        "likes": post_data.get('likes', 0),
                        "liked_by": post_data.get('liked_by', []),
                        "userLogo": user_details.get('profilePic'),
                        "repost": True,
                        "repostedDisplayname": reposted_user_details.get('display_name', ''),
                        "repostedUserLogo": reposted_user_details.get('profilePic'),
                        "repostedTimestamp": original_message_data.get('timestamp', ''),
                    })
                else:
                    print("Original message not found for messageId:", post_data['messageId'])

            else:
                # Handle non-reposted (original) posts
                result.append({
                    "postId": post_id,
                    "post_userId": post_userId,
                    "displayname": user_details.get('display_name', ''),
                    "text": post_data.get('content', ''),
                    "timestamp": post_data.get('timestamp', ''),
                    "likes": post_data.get('likes', 0),
                    "liked_by": post_data.get('liked_by', []),
                    "userLogo": user_details.get('profilePic',),
                    "repost": False
                })
        return result
    except Exception as e:
        print(f"Error fetching posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def find_and_update_conversation(user_id, post_user_id, isPrivate, text):
    conversation_id = await find_conversation_with_type(user_id, post_user_id, isPrivate)
    
    if isPrivate:
        if conversation_id is None:
            can_send = await check_weekly_limit(user_id, post_user_id)
            if not can_send:
                return {"status": "error", "message": "Need to buy premium."}

    
    if conversation_id:
        # Update the existing conversation
        conversation_ref = db.collection('conversations').document(conversation_id)
        conversation_ref.update({
            f'last_updated.{user_id}': datetime.utcnow(),
            'last_message': text,  # Store encrypted text for private conversations
        })
    else:
        # Create a new conversation document
        conversation_ref = db.collection('conversations').document()
        conversation_ref.set({
            'participants': [user_id, post_user_id],
            'last_updated': datetime.utcnow(),
            'is_private': isPrivate,
            'last_updated': {
                    user_id: datetime.utcnow(),
                    post_user_id: datetime.utcnow()  # Initially set both to the same time when conversation is created
                },
            'last_message': text, 
        })
        conversation_id = conversation_ref.id

    return conversation_id

async def update_post_reply_count(post_id):
    """
    Increment the reply count for a specific post.
    """
    # Reference to the post document
    post_ref = db.collection('posts').document(post_id)
    
    # Atomically increment the reply count by 1
    post_ref.update({'reply_count': Increment(1)})


async def post_reply(user_id, post_id, post_user_id, text, isPrivate):
    # Encrypt text if the conversation is private

    conversation_id = await find_and_update_conversation(user_id, post_user_id, isPrivate, text)
    
    # Add the encrypted or plain text to the conversation's messages
    conversation_messages_ref =  db.collection('conversations').document(conversation_id).collection('messages')
    message_doc =  conversation_messages_ref.add({
        'user_id': user_id,
        'text': text,  # Use encrypted text for private messages
        'from_bot': False,
        'timestamp': datetime.utcnow(),
        'post_id': post_id
    })

    # Handling public replies differently is not necessary here since encryption is applied based on conversation type
    if not isPrivate:
        post_replies_ref = db.collection('postReplies').add({
            'postId': post_id,
            'conversationId': conversation_id,
            'messageId': message_doc[1].id,
            'userId': user_id,
            'text': text,  # For public replies, store plain text
            'timestamp': datetime.utcnow(),
        })

    # Optionally update reply count in the post document
    await update_post_reply_count(post_id)

    post_owner_details= await get_user_details(post_user_id)
    user_details = await get_user_details(user_id)

    # Send notification
    send_reply_post_notification(
        receiver_token=post_owner_details.get('fcm_token'),
        reply_content=text,
        isPrivate=isPrivate,
        conversation_id=conversation_id,
        post_id=post_id,
        sender_id=user_id,
        sender_display_name= user_details.get('display_name'),
        sender_username= user_details.get('username'),
        sender_profilePic=user_details.get('profilePic'),
        receiver_id=post_user_id,
        receiver_username=post_owner_details.get('username'),
        receiver_display_name=post_owner_details.get('display_name'),  # assuming get_user_details fetches 'display_name'
        receiver_profilePic=post_owner_details.get('profilePic'),  # assuming get_user_details fetches 'profilePic'

    )
    return message_doc[1].id

