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

    if (notificationData.post_id && notificationData.user_id) {
      // This assumes your like notification has post_id and user_id fields

      await showNotification(
        navigation,
        false,
        notificationData.display_name + ' liked your post',
        notificationData.post_content, // Assuming likes aren't private, adjust as necessary
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
      // Determine if it's a like notification
      if (remoteMessage.data.post_id && remoteMessage.data.user_id) {
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
