// NotificationService.js

import axios from 'axios';

/**
 * Sends a notification to a specified receiver.
 *
 * @param {string} apiUrl - The base URL of your backend API.
 * @param {string} receiverToken - The FCM token of the notification receiver.
 * @param {string} display_name - Title of the notification.
 * @param {string} content - Body content of the notification.
 * @param {string} profilePic - URL of the sender's profile picture.
 * @param {string} conversationId - ID of the conversation.
 * @param {string} senderId - ID of the sender.
 */
export const sendNotification = async ({
  apiUrl,
  receiverToken,
  display_name,
  content,
  profilePic,
  conversationId,
  senderId,
}) => {
  try {
    console.log(
      apiUrl,
      receiverToken,
      display_name,
      content,
      profilePic,
      conversationId,
      senderId,
    );
    const response = await axios.post(`${apiUrl}/send_notification/`, {
      receiver_token: receiverToken,
      display_name,
      content,
      profilePic,
      conversation_id: conversationId,
      sender_id: senderId,
    });

    console.log('Notification sent successfully:', response.data);
  } catch (error) {
    console.error('Failed to send notification:', error.response || error);
  }
};
