import firebase_admin
from firebase_admin import firestore
from fastapi import HTTPException
from dependencies import db
from fastapi.responses import JSONResponse


def create_user_in_db(display_name: str, username: str, dob: str, bio: str, google_user_id: str, firebase_uid: str):
    users_ref = db.collection('users')

    # Check if username already exists
    username_query = users_ref.where('username', '==', username).stream()
    if any(username_query):
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create the user
    user_data = {
        "display_name": display_name,
        "username": username,
        "dob": dob,
        "bio": bio,
        "google_user_id": google_user_id
    }

        # Use Firebase UID as the document ID
    users_ref.document(firebase_uid).set(user_data)
    return {"success": True, "message": "User created successfully"}


def get_user_from_db(username: str):
    users_ref = db.collection('users')
    query = users_ref.where('username', '==', username).stream()
    
    for doc in query:
        return doc.to_dict()

    raise HTTPException(status_code=404, detail="User not found")

 
    
def check_user_exists(google_user_id: str):
    users_ref = db.collection('users')
    user_query = users_ref.where('google_user_id', '==', google_user_id).stream()

    # Check if any document returned from the query
    if any(user_query):
        return JSONResponse(content={"message": "User exists in Firestore"}, status_code=200)
    else:
        return JSONResponse(content={"message": "User not found"}, status_code=404)






