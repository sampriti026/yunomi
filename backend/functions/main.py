import firebase_admin
from firebase_admin import credentials, firestore
from openai import OpenAI
from datetime import datetime, timedelta
import pytz

# Initialize Firebase Admin
cred = credentials.Certificate('yunomi026-firebase-adminsdk-b9dts-7aeacab137.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize OpenAI
client = OpenAI(
    # This is the default and can be omitted
    api_key='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',
)

def scheduled_function(request):
    print("Function triggered")
    now = datetime.utcnow().replace(tzinfo=pytz.utc)
    conversations_ref = db.collection('conversations')

    def update_summary(conversation_id, messages):
        message_texts = [msg.get('text') for msg in messages]
        message_text = " ".join(message_texts)

        try:
            summary_response = client.completions.create(
                model="gpt-3.5-turbo-instruct",
                prompt=f"Based on this conversation between users, write a simple and concise summary of what they are talking about: {message_text}",
                max_tokens=150
            )
            summary = summary_response['choices'][0]['text'].strip()
            print(f"Summary: {summary}")
            conversations_ref.document(conversation_id).update({
                'last_summary_update': firestore.SERVER_TIMESTAMP,
                'summary': summary
            })
        except Exception as e:
            print(f"Error generating summary for {conversation_id}: {e}")

    conversations = conversations_ref.stream()
    for conversation in conversations:
        conversation_id = conversation.id
        last_summary_update = conversation.to_dict().get('last_summary_update')
        last_summary_timestamp = last_summary_update.timestamp() if last_summary_update else 0
        messages_query = db.collection(f'conversations/{conversation_id}/messages') \
            .where('timestamp', '>', last_summary_timestamp) \
            .order_by('timestamp', direction=firestore.Query.ASCENDING)
        messages = messages_query.stream()

        new_messages = list(messages)
        if len(new_messages) >= 15:
            update_summary(conversation_id, new_messages)

    return "Function executed successfully"

