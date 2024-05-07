// fcmService.js
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

export async function updateFcmToken(firebaseUid) {
  const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      try {
        // Send the FCM token in the request body as JSON
        const response = await axios.put(
          `${apiUrl}/update_fcm_token/${firebaseUid}/`,
          {
            fcm_token: fcmToken,
          },
        );
        console.log(response);
      } catch (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error data:', error.response.data);
          console.error('Error status:', error.response.status);
          console.error('Error headers:', error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('Error request:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', error.message);
        }
        console.error(error.config);
      }
    }
  }
}
