from fastapi import APIRouter
from services import  user_services
from pydantic import BaseModel

class UserCreate(BaseModel):
    display_name: str
    username: str
    dob: str
    bio: str
    google_user_id: str
    firebase_uid: str


router = APIRouter()

@router.post("/create_user/")
async def create_user(user: UserCreate):
    return user_services.create_user_in_db(user.display_name, user.username, user.dob, user.bio, user.google_user_id, user.firebase_uid)

@router.get("/get_user/{username}/")
async def get_user(username: str):
    return user_services.get_user_from_db(username)

@router.get("/check_user_exists/{google_user_id}/")
async def check_user_exists(google_user_id: str):
    return user_services.check_user_exists(google_user_id)