from fastapi import APIRouter
from models import Message, Post, SendMessageRequest
from services import chat_service, post_service, message_service

router = APIRouter()


@router.post("/start_conversation")
async def start_conversation(message: Message):
    if not chat_service.is_first_time_user(message.user_id):
        return {"status": "failure", "reason": "User has logged in before"}

    options = [
        "want to make friends",
        "just bored",
        "im curious about people"
    ]

    return {"status": "success", "prompt": "Why are you here?", "options": options}



@router.post("/receive_message")
async def receive_message(message: Message):
    response =  await message_service.receive_message(message)
    print("FastAPI app started!")
    return response


@router.post("/send_post")
async def send_post(post: Post):
    response = post_service.send_post(post)
    return response


@router.get("/get_post/{post_id}")
async def get_post(post_id: str):
    response = post_service.get_post(post_id)
    return response


@router.post("/like_post")
async def like_post(post_id: str, user_id: str):
    response = post_service.like_post(post_id, user_id)
    return response


@router.post("/send_message")
async def send_message(request: SendMessageRequest):
    response = message_service.send_message(request)
    return response


@router.get("/fetchBotConversation/{user_id}")
async def fetchBotConversation(user_id: str):
    response = await message_service.fetch_bot_conversation(user_id)
    return response


@router.get("/get_latest_chats")
async def get_latest_chats(user_id: str):
    chats = chat_service.fetch_latest_chats(user_id)
    return chats


