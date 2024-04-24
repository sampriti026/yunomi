/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import PushNotification from 'react-native-push-notification';



PushNotification.createChannel(
  {
    channelId: "yunomi", // match this id with the channelId you use when showing the notification
    channelName: "yunomi",
    channelDescription: "notifications from yunomi", // (optional) default: undefined.
    playSound: true, // (optional) default: true
    soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
    importance: 4, // (optional) default: 4. Int value of the Android notification importance
    vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
  },
  
  (created) => console.log(`CreateChannel returned '${created}'`)
   // (optional) callback returns whether the channel was created, false means it already existed.
);


AppRegistry.registerComponent(appName, () => App);
