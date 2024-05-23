from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional



class Message(BaseModel):
    user_id: str
    text: str


class ReplyModel(BaseModel):
    user_id: str
    text: str
    timestamp: datetime


class Post(BaseModel):
    user_id: str
    message_id: Optional[str] = None  # Make messageId optional
    timestamp: datetime
    repost: bool = False
    likes: int = 0
    liked_by: List[str] = []
    conversationId: Optional[str] = None  # Make messageId optional
    content: Optional[str] = Field(None, description="The content of the post")  # Add content field
    reply_count: int = 0  # To keep track of the number of replies
    replies: Optional[List[ReplyModel]] = []  # List of replies, could be limited to the most recent ones for efficiency


class PostReplyRequest(BaseModel):
    user_id: str
    post_id: str
    post_user_id: str
    text: str
    isPrivate: bool  # Consider validating this as an enum if there are only specific types allowed

class SendMessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    text: str
    is_private: bool  # Add this line
    conversation_id: Optional[str] = None
    


class UserDetail(BaseModel):
    display_name: str
    username: str
    bio: str
    profilePic: str
    dob: str
    # Add other user details as needed

class ConversationDetail(BaseModel):
    conversation_id: str
    last_message: str
    last_updated: datetime
    other_user_details: Optional[UserDetail]  # Details of the other user in the conversation


class ConversationRequest(BaseModel):
    user_id: str

class Query(BaseModel):
    user_query: str

class TextInput(BaseModel):
    text: str

class NotificationRequest(BaseModel):
    receiver_token: str
    display_name: str
    content: str
    profilePic: str
    conversation_id: str
    sender_id: str