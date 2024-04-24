from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import requests
from routers import chat_router, user_router, post_router, notif_router
from models import TextInput
from services.common_service import update_embeddings_with_messages

app = FastAPI()

app.include_router(chat_router.router)

app.include_router(user_router.router)

app.include_router(post_router.router)

app.include_router(notif_router.router)
from dotenv import load_dotenv

load_dotenv()  # This loads the environment variables from .env.




@app.post("/get_embedding/")
def get_embedding(text_input: TextInput):
    print("get_embedding called with text:", text_input.text)  # Debug print
    try:
        print("Sending request to embedding model server")  # Debug print
        response = requests.post(
            "http://127.0.0.1:8080/embed",
            json={"inputs": text_input.text},
            headers={'Content-Type': 'application/json'},
            timeout=10  # Timeout added
        )
        print("Received response with status:", response.status_code)  # Debug print
        response.raise_for_status()
        embedding = response.json()
        return embedding
    except requests.RequestException as e:
        print("Error occurred:", e)  # Debug print
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root(background_tasks: BackgroundTasks):
    background_tasks.add_task(update_embeddings_with_messages)
    return {"message": "Task is running in the background"}

#uvicorn your_project.main:app --reload

# You can run the FastAPI application with Uvicorn:
# `uvicorn main:app --reload`
