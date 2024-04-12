from fastapi import APIRouter
from services import  user_services
from pydantic import BaseModel
from typing import Optional
from fastapi import HTTPException

class UserCreate(BaseModel):
    display_name: str
    username: str
    email: Optional[str] = None
    google_user_id: Optional[str] = None  # Make google_user_id optional
    firebase_uid: str



router = APIRouter()

class FcmTokenUpdateRequest(BaseModel):
    fcm_token: str

@router.post("/create_user/")
async def create_user(user: UserCreate):
    print(user)
    return user_services.create_user_in_db(user.display_name, user.username, user.google_user_id, user.firebase_uid, user.email)

@router.get("/get_user/{username}/")
async def get_user(username: str):
    return user_services.get_user_from_db(username)

@router.get("/check_user_exists/{google_user_id}/")
async def check_user_exists(google_user_id: str):
    return user_services.check_user_exists(google_user_id)

@router.get("/get_userDetails")
async def get_user_details(user_id: str):
    return await user_services.get_user_details(user_id)

@router.put("/update_fcm_token/{firebase_uid}/")
async def update_fcm_token(firebase_uid: str, request: FcmTokenUpdateRequest):
    success = await user_services.update_user_fcm_token(firebase_uid, request.fcm_token)
    if success:
        return {"message": "FCM token updated successfully."}
    else:
        raise HTTPException(status_code=404, detail="User not found.")


