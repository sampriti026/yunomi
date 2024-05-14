from fastapi import APIRouter
from models import Post
from services import post_service
from pydantic import BaseModel, Field
from typing import List
import logging
from fastapi import APIRouter, HTTPException, status, Body
from fastapi.responses import JSONResponse


router = APIRouter()

class PostModel(BaseModel):

    displayname: str
    text: str
    timestamp: str
    likes: int
    userLogo: str
    repost: bool
    repostedDisplayname: str = None
    repostedUserLogo: str = None
    repostedTimestamp: str = None

class PostReplyRequest(BaseModel):
    user_id: str
    post_id: str
    post_user_id: str
    text: str
    isPrivate: bool  # Consider validating this as an enum if there are only specific types allowed



@router.post("/send_post")
async def send_post(post: Post):
    response = post_service.send_post(post)
    return response

@router.post("/toggle_like/{post_id}/{user_id}")
async def toggle_like(post_id: str, user_id: str):
    response = await post_service.toggle_like(post_id, user_id)
    return response

@router.get("/fetch_posts")
async def fetch_posts():
    response = await post_service.fetch_posts()
    return response


@router.post("/post_reply")
async def post_reply(request: PostReplyRequest):
    logging.info(f"Received request: {request}")

    try:
        # Call your existing function with the parameters from the request
        reply_id = await post_service.post_reply(
            user_id=request.user_id,
            post_id=request.post_id,
            post_user_id=request.post_user_id,
            text=request.text,
            isPrivate=request.isPrivate
        )
        return {"reply_id": reply_id, "message": "Reply posted successfully."}
    except Exception as e:
        logging.error(f"Error processing post_reply: {e}", exc_info=True)
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": str(e)})
