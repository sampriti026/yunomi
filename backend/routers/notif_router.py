from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import  notif_service
from models import NotificationRequest



router = APIRouter()


@router.post("/send_notification/")
async def send_notification(request: NotificationRequest):
    try:
        content = "You have a private message" if request.isPrivate else request.content
        print(content, "content")
        notif_service.send_fcm_notification(
            receiver_token=request.receiver_token,
            display_name=request.display_name,
            content=content,
            profilePic=request.profilePic,
            conversation_id=request.conversation_id,
            sender_id=request.sender_id
        )
        return {"message": "Notification sent successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
