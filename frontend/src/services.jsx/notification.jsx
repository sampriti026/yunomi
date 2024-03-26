import messaging from '@react-native-firebase/messaging';
import {showNotification} from './showNotification';
import {getActiveChatId} from '../components/storage';

const setupForegroundMessageHandler = () => {
  messaging().onMessage(async remoteMessage => {
    const notificationData = remoteMessage.data;
    const activeChatId = await getActiveChatId();
    console.log('setupforeground called', notificationData);

    if (notificationData.conversationId === activeChatId) {
      console.log('Notification is for active chat, not showing notification.');

      return; // Skip showing the notification
    }

    const isPrivate = notificationData.isPrivate === 'true';
    console.log('Message received in foreground');
    console.log('notificationData.display_name', notificationData);
    showNotification(
      notificationData.display_name,
      notificationData.content,
      isPrivate,
      notificationData.profilePic,
    );
  });
};

export default setupForegroundMessageHandler;
