from firebase_admin import messaging

def send_fcm_notification(receiver_token: str, display_name: str, content: str, profilePic: str, conversation_id: str, sender_id: str, isPrivate: bool):
    # Define the notification payload
    content = "You have a private message" if isPrivate else content
    print(content, "notif content")


    message = messaging.Message(
        notification=messaging.Notification(
            title=display_name,
            body=content,
            image=profilePic
        ),
        data={
            "display_name": display_name,
            "content": content,
            "conversationId": conversation_id,
            "senderId": sender_id,
            "profilePic": profilePic,
            "isPrivate": 'true' if isPrivate else 'false'

        },
        token=receiver_token
    )
    print(message.data)

    # Send the message
    print(message, "message")
    response = messaging.send(message)
    print('Successfully sent notif:', response)
