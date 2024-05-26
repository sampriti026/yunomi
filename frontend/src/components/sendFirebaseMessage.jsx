import firestore from '@react-native-firebase/firestore';

export const checkWeeklyLimitAndUpdate = async (
  userId,
  receiverUserId,
  isProfileLiked,
) => {
  const userRef = firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const receiverUserRef = firestore().collection('users').doc(receiverUserId);
  const receiverUserDoc = await receiverUserRef.get();
  const receiverUserData = receiverUserDoc.data();

  if (receiverUserData.user_likes.includes(userId)) {
    // Add your logic here for when the userId is found in receiverUserId's user_likes array
    return true;
  }

  if (!userDoc.exists) {
    console.error('User not found');
    return false; // User not found, handle appropriately
  }
  if (userData.premium) {
    return true;
  }

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

export const findConversationId = async (userId, otherUserId, isPrivate) => {
  try {
    // Query conversations that include the current user and match the privacy setting
    const querySnapshot = await firestore()
      .collection('conversations')
      .where('participants', 'array-contains', userId)
      .where('is_private', '==', isPrivate)
      .get();

    // Filter the conversations further to find one that includes both the specified participants only
    const matchingConversation = querySnapshot.docs.find(doc => {
      const data = doc.data();
      const {participants} = data;
      // Check if the participants array includes both userId and otherUserId and no others
      return participants.includes(otherUserId) && participants.length === 2;
    });

    // If a matching conversation is found, return its ID
    if (matchingConversation) {
      return matchingConversation.id;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error finding conversation: ', error);
    return null;
  }
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

    conversationId = await findConversationId(senderId, receiverId, isPrivate);

    // Check for existing conversation or create a new one
    if (!conversationId) {
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
    } else {
      await conversationsRef.doc(conversationId).update({
        last_message: text,
        last_updated: {
          [senderId]: firestore.Timestamp.now(),
          [receiverId]: firestore.Timestamp.now(),
        },
      });
    }
    console.log(conversationId);
    // Add message to the conversation's message collection
    await conversationsRef.doc(conversationId).collection('messages').add({
      user_id: senderId,
      text: text,
      from_bot: false,
      timestamp: firestore.Timestamp.now(),
    });

    console.log('Message sent successfully to conversation:', conversationId);
    return {status: 'success', conversationId};
  } catch (error) {
    console.error('Error sending message:', error);
    return {status: 'error'};
  }
};
