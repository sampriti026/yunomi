import messaging from '@react-native-firebase/messaging';
import {showNotification} from './showNotification';
import {getActiveChatId} from '../components/storage';

const setupForegroundMessageHandler = navigation => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    const notificationData = remoteMessage.data;
    const activeChatId = await getActiveChatId();

    if (notificationData.conversationId === activeChatId) {
      return; // Skip showing the notification
    }

    if (notificationData.reply_content) {
      // Handling reply to post notification

      const isPrivate = notificationData.isPrivate === 'true';
      if (isPrivate) {
        notificationData.reply_content =
          'Someone replied privately on your post';
      }
      await showNotification(
        navigation,
        isPrivate,
        notificationData.sender_display_name + ' sent a reply to your post.', // Using dynamic title from notification
        notificationData.reply_content, // Displaying reply content
        remoteMessage.data,
      );
    } else if (notificationData.post_id && notificationData.user_id) {
      // This assumes your like notification has post_id and user_id fields

      await showNotification(
        navigation,
        false,
        notificationData.display_name + ' liked your post',
        notificationData.post_content, // Assuming likes aren't private, adjust as necessary
        remoteMessage.data,
      );
    } else if (notificationData.user_id && !notificationData.post_id) {
      // Assuming profile likes don't include a post_id
      await showNotification(
        navigation,
        false, // Profile likes are not private
        'Profile Like', // Title of the notification
        `${notificationData.display_name} liked your profile!`, // Message body
        remoteMessage.data,
      );
    } else {
      const isPrivate = notificationData.isPrivate === 'true';
      await showNotification(
        navigation,
        isPrivate,
        notificationData.sender_display_name + ' sent you a message',
        notificationData.content,
        remoteMessage.data,
      );
    }
  });

  const onNotificationOpened = messaging().onNotificationOpenedApp(
    remoteMessage => {
      const {
        conversationId,
        sender_id,
        receiver_id,
        receiver_display_name,
        receiver_username,
        receiver_profilePic,
        sender_profilePic,
        sender_display_name,
        sender_username,
        isPrivate,
      } = remoteMessage.data;
      // Determine if it's a like notification
      if (remoteMessage.data.reply_content) {
        // Handling reply to post notification
        navigation.navigate('ChatScreen', {
          senderUserId: receiver_id,
          receiverUserId: sender_id,
          receiverDisplayName: sender_display_name,
          receiverUsername: sender_username,
          receiverProfilePic: sender_profilePic,
          isPrivate,
          conversationId,
          index: 0,
          viewOnlyPublic: false,
          senderProfilePic: receiver_profilePic,
          senderDisplayName: receiver_display_name,
          senderUsername: receiver_username,
        });
      } else if (remoteMessage.data.post_id && remoteMessage.data.user_id) {
        navigation.navigate('ProfileScreen', {
          userId: remoteMessage.data.user_id, // Assuming you have a user ID field
          displayName: remoteMessage.data.display_name,
          profilePic: remoteMessage.data.profilePic,
          username: remoteMessage.data.username,
        });
      } else if (remoteMessage.data.user_id && !remoteMessage.data.post_id) {
        // Assuming profile likes don't include a post_id
        navigation.navigate('ProfileScreen', {
          userId: remoteMessage.data.user_id, // Assuming you have a user ID field
          displayName: remoteMessage.data.display_name,
          profilePic: remoteMessage.data.profilePic,
          username: remoteMessage.data.username,
        });
      } else {
        // Existing code for handling chat-related notifications
        const {
          conversationId,
          sender_id,
          receiver_id,
          receiver_display_name,
          receiver_username,
          receiver_profilePic,
          sender_profilePic,
          sender_display_name,
          sender_username,
        } = remoteMessage.data;
        const isPrivate = remoteMessage.data.isPrivate === 'true';

        navigation.navigate('ChatScreen', {
          senderUserId: receiver_id,
          receiverUserId: sender_id,
          receiverDisplayName: sender_display_name,
          receiverUsername: sender_username,
          receiverProfilePic: sender_profilePic,
          isPrivate,
          conversationId,
          index: 0,
          viewOnlyPublic: false,
          senderProfilePic: receiver_profilePic,
          senderDisplayName: receiver_display_name,
          senderUsername: receiver_username,
        });
      }
    },
  );

  // messaging().setBackgroundMessageHandler(async remoteMessage => {
  //   console.log('Message handled in the background!', remoteMessage);
  // });

  return () => {
    unsubscribe();
    onNotificationOpened(); // Unsubscribe onNotificationOpened listener
  };
};

export default setupForegroundMessageHandler;
