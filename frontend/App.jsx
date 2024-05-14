import React, {useState, useEffect} from 'react';
import LoginPage from './src/screens/login';
import FrameTabsScreen from './src/screens/frametabs';
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

enableScreens();
const AppStack = createStackNavigator();

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      setIsSignedIn(!!user);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const Tab = createMaterialTopTabNavigator();

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
      } catch (err) {
        console.error('IAP init error:', err);
      }
    };

    initIAP();
    return () => {
      RNIap.endConnection();
    };
  }, []);

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });

  if (initializing) return null; // Show loading spinner here if you'd like

  const NotificationHandler = () => {
    const navigation = useNavigation();

    useEffect(() => {
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log(
              'Notification caused app to open from quit state:',
              remoteMessage,
            );
            // Extract the required data and navigate
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
            console.log(
              'Navigating to ChatScreen with data:',
              remoteMessage.data,
            );

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
    <GestureHandlerRootView style={{flex: 1}}>
      <MenuProvider>
        <NavigationContainer>
          <NotificationHandler />
          <AppStack.Navigator screenOptions={{headerShown: false}}>
            {isSignedIn ? (
              <>
                <AppStack.Screen
                  name="FrameTabsScreen"
                  component={FrameTabsScreen}
                />
                <AppStack.Screen name="ChatScreen" component={ChatScreen} />
                <AppStack.Screen
                  name="ProfileScreen"
                  component={ProfileScreen}
                />
              </>
            ) : (
              <AppStack.Screen name="Login" component={LoginPage} />
            )}
          </AppStack.Navigator>
        </NavigationContainer>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}

export default App;
