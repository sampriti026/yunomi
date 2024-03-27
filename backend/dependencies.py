import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
cred = credentials.Certificate('yunomi026-firebase-adminsdk-b9dts-7aeacab137.json')
firebase_admin.initialize_app(cred)
db = firestore.client()



