export const markAsRead = async (conversationId, userId) => {
  const conversationRef = firestore()
    .collection('conversations')
    .doc(conversationId);
  await conversationRef.update({
    [`lastRead.${userId}`]: firestore.FieldValue.serverTimestamp(),
  });
};
