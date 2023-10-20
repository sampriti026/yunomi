from pydantic import BaseModel
from datetime import datetime

class Message(BaseModel):
    user_id: str
    text: str


class Post(BaseModel):
    user_id: str
    content: str
    display_name: str
    profile_pic_uri: str


class SendMessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    text: str
