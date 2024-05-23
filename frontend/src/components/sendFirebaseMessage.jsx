import firestore from '@react-native-firebase/firestore';

export const checkWeeklyLimitAndUpdate = async userId => {
  const userRef = firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.error('User not found');
    return false; // User not found, handle appropriately
  }

  const userData = userDoc.data();
  const currentTimestamp = firestore.Timestamp.now();
  const lastReset = userData.last_message_reset?.toDate();
  const oneWeekAgo = new Date(
    currentTimestamp.toDate().getTime() - 7 * 24 * 60 * 60 * 1000,
  );

  if (!lastReset || lastReset < oneWeekAgo) {
    // Reset the message count if a week has passed
    await userRef.update({
      last_message_reset: currentTimestamp,
      message_count: 1,
    });
    return true;
  } else if (userData.message_count < 3) {
    // Increment the message count and allow the message
    await userRef.update({
      message_count: firestore.FieldValue.increment(1),
    });
    return true;
  }

  return false; // Weekly limit exceeded
};

export const sendFirebaseMessage = async (
  senderId,
  receiverId,
  text,
  isPrivate,
) => {
  try {
    const conversationsRef = firestore().collection('conversations');
    let conversationId = '';

    // Check for existing conversation or create a new one
    const querySnapshot = await conversationsRef
      .where('participants', 'array-contains', senderId)
      .where('participants', 'array-contains', receiverId)
      .where('is_private', '==', isPrivate)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      // Conversation exists
      conversationId = querySnapshot.docs[0].id;
    } else {
      // Create new conversation
      const newConversationRef = await conversationsRef.add({
        participants: [senderId, receiverId],
        is_private: isPrivate,
        last_message: text,
        last_updated: {
          [senderId]: firestore.Timestamp.now(),
          [receiverId]: firestore.Timestamp.now(),
        },
      });
      conversationId = newConversationRef.id;
    }

    // Add message to the conversation's message collection
    await conversationsRef.doc(conversationId).collection('messages').add({
      user_id: senderId,
      text: text,
      from_bot: false,
      timestamp: firestore.Timestamp.now(),
    });

    // Optionally update the conversation with last message details
    await conversationsRef.doc(conversationId).update({
      last_message: text,
      last_updated: {
        [senderId]: firestore.Timestamp.now(),
        [receiverId]: firestore.Timestamp.now(),
      },
    });

    console.log('Message sent successfully to conversation:', conversationId);
    return {status: 'success', conversationId};
  } catch (error) {
    console.error('Error sending message:', error);
    return {status: 'error'};
  }
};
