from fastapi import FastAPI
from routers import chat_router, user_router, post_router, notif_router
from services.ai import scheduled_function
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
import schedule
import time
from threading import Thread

load_dotenv()  # This loads the environment variables from .env.

app = FastAPI()

app.include_router(chat_router.router)

app.include_router(user_router.router)

app.include_router(post_router.router)


scheduler = AsyncIOScheduler(timezone="UTC")

def run_scheduler():
    schedule.every().day.at("20:20").do(scheduled_function)
    while True:
        schedule.run_pending()
        time.sleep(1)

# Start the scheduler in a separate thread
Thread(target=run_scheduler, daemon=True).start()

@app.get("/")
async def read_root():
    return {"message": "Hello, world!"}




#uvicorn your_project.main:app --reload

# You can run the FastAPI application with Uvicorn:
# `uvicorn main:app --reload`
