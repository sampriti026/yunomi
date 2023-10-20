from fastapi import FastAPI
from routers import chat_router, user_router

app = FastAPI()

app.include_router(chat_router.router)

app.include_router(user_router.router)


#uvicorn your_project.main:app --reload

# You can run the FastAPI application with Uvicorn:
# `uvicorn your_filename:app --reload`
