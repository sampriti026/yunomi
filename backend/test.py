from firebase_admin import messaging
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
cred = credentials.Certificate('yunomi026-firebase-adminsdk-b9dts-7aeacab137.json')
firebase_admin.initialize_app(cred)
db = firestore.client()


def check_token_validity(fcm_token):
    # Dummy payload
    message = messaging.Message(
        data={
            'health_check': 'true'
        },
        token=fcm_token,
    )
    try:
        # Attempt to send the message.
        response = messaging.send(message)
        print('Successfully sent message:', response)
        return True
    except firebase_admin.exceptions.FirebaseError as error:
        # Inspect the error code.
        print('Failed to send message:', error)
        return False

# Replace 'your_fcm_token_here' with the actual FCM token you want to check.
is_valid = check_token_validity('dfuPDyPxTgyR6pku1syjUn:APA91bGSAIzZktG81nVJCO6cakgrWKIQp7pRoo4CJ6vfbcY18r4Iy47CLvGI8gDlFiz2imm1ISA3yDWRacwCpqeSkxzZMTqnnzXU1MGzv8D98qzWOqyp1B8AzELEAxXactMVhzm3JYEp')
print('Token is valid:', is_valid)

