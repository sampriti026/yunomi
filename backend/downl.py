import firebase_admin
from firebase_admin import credentials, storage

# Initialize the Firebase Admin SDK
cred = credentials.Certificate('yunomi026-firebase-adminsdk-b9dts-7aeacab137.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'yunomi026.appspot.com'
})

# Reference to the Firebase Storage bucket
bucket = storage.bucket()

# Reference to the file in storage
blob = bucket.blob('profilePic.png')
blob.make_public()


print(f"The file is now publicly accessible at {blob.public_url}")
