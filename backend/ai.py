import firebase_admin
from firebase_admin import credentials, firestore
import openai
from config import openai_key
from openai import OpenAI


# Initialize Firebase
cred = credentials.Certificate('yunomi026-firebase-adminsdk-b9dts-7aeacab137.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

client = OpenAI(
    # This is the default and can be omitted
    api_key='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',
)

# Initialize OpenAI

def fetch_and_summarize():
    conversations_ref = db.collection('conversations')
    conversations = conversations_ref.where('is_private', '==', False).stream()

    for conversation in conversations:
        conversation_id = conversation.id
        messages_ref = db.collection(f'conversations/{conversation_id}/messages')
        messages_query = messages_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(20)
        messages = messages_query.stream()

        message_texts = []
        user_names = {}
        for message in messages:
            message_texts.append(message.get('text'))
            user_names[message.get('user_id')] = message.get('user_id')

        message_text = " ".join(message_texts)
        print(message_texts)
        
        try:
            summary_response = client.completions.create(
                model="gpt-3.5-turbo-instruct",
                prompt=f"Based on this conversation between users, write a simple and concise summary of what they are talking about: {message_text}",
                max_tokens=150
            )
            summary = summary_response
            print(summary)

        except Exception as e:
            print(f"Error generating summary: {e}")

        # Update the conversation document

if __name__ == '__main__':
    fetch_and_summarize()
