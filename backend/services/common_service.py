from dependencies import db


def find_conversation(participant1, participant2):
    """
    Find a conversation between two participants.
    """
    conversations_ref = db.collection('conversations')
    conversations = conversations_ref.where('participants', 'array_contains', participant1).stream()
    for conversation in conversations:
        participants = conversation.to_dict().get('participants', [])
        if participant2 in participants:
            return conversation.id
    return None