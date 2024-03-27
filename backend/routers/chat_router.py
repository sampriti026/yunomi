from fastapi import APIRouter, HTTPException
from models import Message, Post, SendMessageRequest, ConversationRequest
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


@router.post("/send_message")
async def send_message(request: SendMessageRequest):
    result = await message_service.send_message(request)
    return result



@router.get("/fetchBotConversation/{user_id}")
async def fetchBotConversation(user_id: str):
    response = await message_service.fetch_bot_conversation(user_id)
    return response


@router.get("/get_latest_chats")
async def get_latest_chats(user_id: str):
    chats = chat_service.fetch_latest_chats(user_id)
    return chats


@router.get("/get_chat_history")
async def get_chat_history(conversationId: str, isPrivate: bool):
    try:
        chats = await message_service.get_chat_history(conversationId, isPrivate)
        return chats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_chatlist")
async def get_conversations(user_id: str):
    return message_service.get_conversations(user_id)


