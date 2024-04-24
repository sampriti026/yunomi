import messaging from '@react-native-firebase/messaging';
import {showNotification} from './showNotification';
import {getActiveChatId} from '../components/storage';

const setupForegroundMessageHandler = () => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    const notificationData = remoteMessage.data;
    const activeChatId = await getActiveChatId();

    if (notificationData.conversationId === activeChatId) {
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

  return unsubscribe;
};

export default setupForegroundMessageHandler;
