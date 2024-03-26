// fcmService.js
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

export async function updateFcmToken(firebaseUid, apiUrl) {
  const authStatus = await messaging().requestPermission();
  console.log(firebaseUid, apiUrl);
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('Your Firebase Token is:', fcmToken);
      try {
        // Send the FCM token in the request body as JSON
        const response = await axios.put(
          `${apiUrl}/update_fcm_token/${firebaseUid}/`,
          {
            fcm_token: fcmToken,
          },
        );
        console.log('FCM token updated successfully:', response.data);
      } catch (error) {
        console.error('Error updating FCM token:', error.response || error);
      }
    } else {
      console.log('Failed to get FCM token');
    }
  }
}
