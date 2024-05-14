import PushNotification from 'react-native-push-notification';

export const showNotification = async (
  navigation,
  isPrivate,
  title,
  message,
  notificationData,
) => {
  PushNotification.localNotification({
    /* Android Only Properties */
    channelId: 'yunomi', // Ensure you create this channel in your app initialization
    ticker: 'My Notification Ticker', // (optional)
    autoCancel: true, // (optional) default: true
    largeIcon: notificationData.profilePic, // (optional) default: "ic_launcher". Use "" for no large icon.
    smallIcon: notificationData.profilePic, // (optional) default: "ic_notification". Use "" for no small icon.
    bigText: message, // (optional) default: "message" prop
    subText: isPrivate ? 'Private' : 'Public',
    color: 'red', // (optional) default: system default
    vibrate: true, // (optional) default: true
    vibration: 300, // vibration length in milliseconds, (optional) default: 1000
    tag: 'some_tag', // (optional) add tag to message
    group: 'group', // (optional) add group to message
    ongoing: false, // (optional) set whether this is an "ongoing" notification
    ignoreInForeground: false,
    data: JSON.stringify({
      isPrivate: isPrivate,
      navigation: navigation,
      ...notificationData,
    }), // Ensure data is passed as a stringified JSON object

    /* iOS and Android properties */
    title: title, // (optional)
    message: message, // (required)
    playSound: true, // (optional) default: true
    soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
  });
};
