import React, {useState, useEffect} from 'react';
import LoginPage from './src/screens/login';
import auth from '@react-native-firebase/auth';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import ChatScreen from './src/screens/chatscreen';
import ProfileScreen from './src/screens/profilescreen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {MenuProvider} from 'react-native-popup-menu';
import messaging from '@react-native-firebase/messaging';
import setupForegroundMessageHandler from './src/services.jsx/notification';
import * as RNIap from 'react-native-iap';
import 'react-native-get-random-values';
import {useNavigation} from '@react-navigation/native';
import PushNotification from 'react-native-push-notification';
import StackNavigator from './src/screens/stacknavigator';
import {AuthProvider, useAuth} from './authcontext';
import fetchUserDetails from './src/services.jsx/fetchUser';

enableScreens();
const AppStack = createStackNavigator();

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [fetchedUserDetails, setFetchedUserDetails] = useState(null);

  const {isSignedIn, setIsSignedIn, isSignUpViaGoogle} = useAuth();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        if (!isSignUpViaGoogle) {
          setIsSignedIn(true);
        } // No action is taken when isSignUpViaGoogle is true
      } else {
        setIsSignedIn(false); // Explicitly set isSignedIn to false when no user is logged in
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, [isSignUpViaGoogle]); // Removed setIsSignedIn from the dependency array

  useEffect(() => {
    const initMessaging = async () => {
      const authStatus = await messaging().requestPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        const fcmToken = await messaging().getToken();
      }
    };

    initMessaging();
  }, []);

  async function requestUserPermission() {
    const authorizationStatus = await messaging().requestPermission();

    if (authorizationStatus) {
    }
  }
  requestUserPermission();

  useEffect(() => {
    const initIAP = async () => {
      try {
        await RNIap.initConnection();
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        const loggedInUserId = auth().currentUser
          ? auth().currentUser.uid
          : null;
        const details = await fetchUserDetails(loggedInUserId);
        setFetchedUserDetails(details);
      } catch (err) {
        console.error('IAP init error:', err);
      }
    };

    initIAP();
    return () => {
      RNIap.endConnection();
    };
  }, []);

  messaging().setBackgroundMessageHandler(async remoteMessage => {});

  if (initializing) return null; // Show loading spinner here if you'd like

  const NotificationHandler = () => {
    const navigation = useNavigation();

    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios' ? true : false,

      onNotification: function (notification) {
        // // Example of navigating to a specific screen
        if (notification.data.reply_content) {
          const isPrivate = notification.data.isPrivate === 'true';
          navigation.navigate('ChatScreen', {
            senderUserId: notification.data.receiver_id,
            receiverUserId: notification.data.sender_id,
            receiverDisplayName: notification.data.sender_display_name,
            receiverUsername: notification.data.sender_username,
            receiverProfilePic: notification.data.sender_profilePic,
            isPrivate: isPrivate,
            conversationId: notification.data.conversation_id,
            index: 0,
            viewOnlyPublic: false,
            senderProfilePic: notification.data.receiver_profilePic,
            senderDisplayName: notification.data.receiver_display_name,
            senderUsername: notification.data.receiver_username,
          });
        } else if (notification.data && notification.data.post_content) {
          navigation.navigate('ProfileScreen', {
            userId: notification.data.user_id, // Assuming you have a user ID field
            displayName: notification.data.display_name,
            profilePic: notification.data.profilePic,
            username: notification.data.username,
          });
        } else {
          const isPrivate = notification.data.isPrivate === 'true';

          navigation.navigate('ChatScreen', {
            senderUserId: notification.data.receiver_id,
            receiverUserId: notification.data.sender_id,
            receiverDisplayName: notification.data.sender_display_name,
            receiverUsername: notification.data.sender_username,
            receiverProfilePic: notification.data.sender_profilePic,
            isPrivate: isPrivate,
            conversationId: notification.data.conversationId,
            index: 0,
            viewOnlyPublic: false,
            senderProfilePic: notification.data.receiver_profilePic,
            senderDisplayName: notification.data.receiver_display_name,
            senderUsername: notification.data.receiver_username,
          });
        }
      },
    });

    useEffect(() => {
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            if (remoteMessage.data.reply_content) {
              // Handling reply to post notification
              navigation.navigate('ProfileScreen', {
                userId: remoteMessage.data.user_id, // Assuming you have a user ID field
                displayName: remoteMessage.data.display_name,
                profilePic: remoteMessage.data.profilePic,
                username: remoteMessage.data.username,
              });
            }
            // Determine if it's a like notification
            else if (remoteMessage.data.post_id && remoteMessage.data.user_id) {
              navigation.navigate('ProfileScreen', {
                userId: remoteMessage.data.user_id, // Assuming you have a user ID field
                displayName: remoteMessage.data.display_name,
                profilePic: remoteMessage.data.profilePic,
                username: remoteMessage.data.username,
              });
            } else {
              // Extract the required data and navigate to ChatScreen
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
                index: 0, // Ensure this index is handled or needed in your ChatScreen
                viewOnlyPublic: false,
                senderProfilePic: receiver_profilePic,
                senderDisplayName: receiver_display_name,
                senderUsername: receiver_username,
              });
            }
          }
        })
        .catch(error => console.error('getInitialNotification error', error));
    }, [navigation]);

    useEffect(() => {
      const unsubscribeFromMessaging =
        setupForegroundMessageHandler(navigation);
      return () => {
        unsubscribeFromMessaging();
      };
    }, [navigation]);

    return null; // This component does not render anything
  };

  return (
    <NavigationContainer>
      <NotificationHandler />
      <AppStack.Navigator screenOptions={{headerShown: false}}>
        {isSignedIn ? (
          <>
            <AppStack.Screen
              name="FrameTabsScreen"
              component={StackNavigator}
            />
            <AppStack.Screen name="ChatScreen" component={ChatScreen} />
            <AppStack.Screen name="ProfileScreen" component={ProfileScreen} />
          </>
        ) : (
          <AppStack.Screen name="Login" component={LoginPage} />
        )}
      </AppStack.Navigator>
    </NavigationContainer>
  );
}

const AppWrapper = () => (
  <GestureHandlerRootView style={{flex: 1}}>
    <AuthProvider>
      <MenuProvider>
        <App />
      </MenuProvider>
    </AuthProvider>
  </GestureHandlerRootView>
);

export default AppWrapper;
