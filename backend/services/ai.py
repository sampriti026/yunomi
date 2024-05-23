import asyncio
from firebase_admin import firestore
from openai import AsyncOpenAI
from datetime import datetime
import pytz
from firebase_admin import credentials, firestore
import os


from dependencies import db


OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI asynchronously
client = AsyncOpenAI(
    api_key=OPENAI_API_KEY,
)


async def update_summary(conversation_id, messages, conversations_ref):
    message_texts = [msg.get('text') for msg in messages]
    message_text = " ".join(message_texts)
    try:
        summary_response = await client.completions.create(
            model="gpt-3.5-turbo-instruct",
            prompt=f"Based on this conversation between users, write a concise summary of what they are talking about in only two sentences. Make it interesting and funny.: {message_text}",
            max_tokens=150
        )
        summary = summary_response.choices[0].text.strip()
        print(f"Summary for conversation {conversation_id}: {summary}")
        conversations_ref.document(conversation_id).update({
            'last_summary_update': firestore.SERVER_TIMESTAMP,
            'summary': summary
        })
    except Exception as e:
        print(f"Error generating summary for conversation {conversation_id}: {e}")

async def scheduled_function():
    print("Function triggered")
    now = datetime.utcnow().replace(tzinfo=pytz.utc)
    conversations_ref = db.collection('conversations')
    tasks = []

    conversations = conversations_ref.where('is_private', '==', False).stream()
    for conversation in conversations:
        conversation_id = conversation.id
        last_summary_update = conversation.to_dict().get('last_summary_update')

        if last_summary_update is None:
            # Handle case where there is no previous summary
            messages_query = db.collection(f'conversations/{conversation_id}/messages')
            messages = messages_query.stream()
            new_messages = list(messages)
            if new_messages:
                task = update_summary(conversation_id, new_messages, conversations_ref)
                tasks.append(task)
        else:
            messages_query = db.collection(f'conversations/{conversation_id}/messages') \
        .where(field_path='timestamp', op_string='>', value=last_summary_update) \
        .order_by(field_path='timestamp', direction=firestore.Query.ASCENDING)

            messages = messages_query.stream()

            new_messages = list(messages)
            if len(new_messages) >= 15:
                task = update_summary(conversation_id, new_messages, conversations_ref)
                tasks.append(task)

    if tasks:
        await asyncio.gather(*tasks)

    return "Function executed successfully"


