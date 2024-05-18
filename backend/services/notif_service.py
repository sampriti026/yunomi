from firebase_admin import messaging

def send_fcm_notification(receiver_token: str,  content: str, conversation_id: str,  isPrivate: bool, sender_id: str, sender_display_name: str, sender_username: str, sender_profilePic: str, receiver_id: str, receiver_display_name: str, receiver_username: str, receiver_profilePic: str):
    # Define the notification payload
    content = "You have a private message" if isPrivate else content
    print(content, "notif content")

    message = messaging.Message(
        notification=messaging.Notification(
            title=sender_display_name,
            body=content,
        ),
        data={
            "content": content,
            "conversationId": conversation_id,
            "isPrivate": 'true' if isPrivate else 'false',
            "sender_id": sender_id,
            "sender_display_name": sender_display_name,
            "sender_username": sender_username,
            "sender_profilePic": sender_profilePic,
            "receiver_id": receiver_id,
            "receiver_display_name": receiver_display_name,
            "receiver_username": receiver_username,
            "receiver_profilePic": receiver_profilePic
        },
        token=receiver_token
    )
    print(message.data)

    # Send the message
    print(message, "message")
    response = messaging.send(message)
    print('Successfully sent notif:', response)


def send_like_notification(receiver_token: str, post_id: str, user_id: str, username: str, display_name: str, profilePic: str, post_content: str):
    try:
        if len(post_content) > 240:
            post_content = post_content[:240] + '...'

        message = messaging.Message(
            notification=messaging.Notification(
            title='New Like',
            body=f'{post_content}',
        ),
        data={
            "post_id": post_id,
            "user_id": user_id,
            "username": username,
            "display_name": display_name,
            "profilePic": profilePic,      
            "post_content": post_content  
            },
        token=receiver_token
        )
        response = messaging.send(message)
        print('Successfully sent notification:', response)
    except Exception as e:
        print(f"Failed to send notification: {e}")


def send_reply_post_notification(receiver_token: str, post_id: str, sender_id: str, sender_display_name: str, sender_username: str, sender_profilePic: str, receiver_id: str, receiver_display_name: str, receiver_username: str, receiver_profilePic: str, reply_content: str, isPrivate: bool, conversation_id: str):
    try:
        if len(reply_content) > 240:
            reply_content = reply_content[:240] + '...'
        
        body_content = f"Someone replied you privately on your post: {reply_content}." if isPrivate else reply_content
        title_content = "New reply" if isPrivate else f'New Reply from {sender_display_name}'

        
        message = messaging.Message(
            notification=messaging.Notification(
                title=title_content,
                body=body_content
            ),
            data={
            "post_id": post_id,
            "reply_content": reply_content,  
            "sender_id": sender_id,
            "sender_display_name": sender_display_name,
            "sender_username": sender_username,
            "sender_profilePic": sender_profilePic,
            "receiver_id": receiver_id,
            "receiver_display_name": receiver_display_name,
            "receiver_username": receiver_username,
            "receiver_profilePic": receiver_profilePic,
            "isPrivate": 'true' if isPrivate else 'false',
            "conversation_id": conversation_id
            },
            token=receiver_token
        )
        response = messaging.send(message)
        print('Successfully sent notification:', response)
    except Exception as e:
        print(f"Failed to send notification: {e}")
