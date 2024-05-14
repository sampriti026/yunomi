import messaging from '@react-native-firebase/messaging';
import {showNotification} from './showNotification';
import {getActiveChatId} from '../components/storage';

const setupForegroundMessageHandler = navigation => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('New foreground notification:', remoteMessage);

    const notificationData = remoteMessage.data;
    const activeChatId = await getActiveChatId();

    if (notificationData.conversationId === activeChatId) {
      console.log('returned');
      return; // Skip showing the notification
    }

    const isPrivate = notificationData.isPrivate === 'true';

    showNotification(
      notificationData.display_name,
      notificationData.content,
      isPrivate,
      notificationData.profilePic,
    );
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
      } = remoteMessage.data;
      const isPrivate = remoteMessage.data.isPrivate === 'true';
      console.log('Navigating to ChatScreen with data:', remoteMessage.data);

      navigation.navigate('ChatScreen', {
        senderUserId: receiver_id,
        receiverUserId: sender_id,
        receiverDisplayName: sender_display_name,
        receiverUsername: sender_username,
        receiverProfilePic: sender_profilePic,
        isPrivate,
        conversationId,
        index: 0, // Make sure this index is handled or needed in your ChatScreen
        viewOnlyPublic: false,
        senderProfilePic: receiver_profilePic,
        senderDisplayName: receiver_display_name,
        senderUsername: receiver_username,
      });
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
