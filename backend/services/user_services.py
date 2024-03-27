from firebase_admin import firestore
from fastapi import HTTPException
from dependencies import db
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime




def create_user_in_db(display_name: str, username: str, google_user_id: Optional[str], firebase_uid: str, email: Optional[str]):
    db = firestore.client()  # Make sure you've initialized Firebase Admin somewhere in your app
    users_ref = db.collection('users')

    # Check if username already exists
    username_query = users_ref.where('username', '==', username).stream()
    if any(username_query):
        raise HTTPException(status_code=400, detail="Username already taken")

    # Prepare user_data with all necessary fields
    user_data = {
        "display_name": display_name,
        "username": username,
        "google_user_id": google_user_id if google_user_id else "",  # Include google_user_id if provided
        "premium": False,  # Initialize premium status
        "last_message_reset": datetime.utcnow(),  # Current UTC time for last_message_reset
        "message_count": 0,  # Initialize message count
        "user_likes": [],  # Initialize user_likes as an empty list
        "bio": "",  # Initialize bio as empty
        "dob": "",  # Initialize dob as empty
        "email": email
    }

    # Create the user document in Firestore
    users_ref.document(firebase_uid).set(user_data)
    return JSONResponse(content={"success": True, "message": "User created successfully"}, status_code=200)



def get_user_from_db(username: str):
    users_ref = db.collection('users')
    query = users_ref.where('username', '==', username).stream()
    
    for doc in query:
        return doc.to_dict()

    raise HTTPException(status_code=404, detail="User not found")

async def update_user_fcm_token(firebase_uid: str, fcm_token: str) -> bool:
    users_ref = db.collection('users')
    user_doc = users_ref.document(firebase_uid).get()
    print(fcm_token, "fcm_token")
    if user_doc.exists:
        users_ref.document(firebase_uid).update({"fcm_token": fcm_token})
        return True
    else:
        return False


 
    
def check_user_exists(google_user_id: str):
    users_ref = db.collection('users')
    user_query = users_ref.where('google_user_id', '==', google_user_id).stream()

    # Instead of returning 404, always return 200 with a boolean indicating existence
    user_exists = any(user_query)
    return JSONResponse(content={"user_exists": user_exists}, status_code=200)


def get_user_details(user_id: str) -> dict:
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


