import React, {useState, useEffect} from 'react';
import LandingPage from './src/screens/landing';
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
import {generateAndSaveKey} from './src/services.jsx/encrypt';
import 'react-native-get-random-values';

enableScreens();

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setIsSignedIn(!!user);
    });

    const timer = setTimeout(() => {
      setShowLanding(false);
    }, 3000);

    return () => {
      subscriber();
      clearTimeout(timer);
    };
  }, []);

  const Tab = createMaterialTopTabNavigator();

  useEffect(() => {
    async function requestPermissionsAndGetToken() {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          console.log('Your Firebase Token is:', fcmToken);
        } else {
          console.log('Failed to get FCM token');
        }
      }
    }

    requestPermissionsAndGetToken();
  }, []);

  useEffect(() => {
    const unsubscribeFromMessaging = setupForegroundMessageHandler();
    return () => {
      unsubscribeFromMessaging();
    };
  }, []);

  async function requestUserPermission() {
    const authorizationStatus = await messaging().requestPermission();

    if (authorizationStatus) {
      console.log('Permission status:', authorizationStatus);
    }
  }
  requestUserPermission();

  useEffect(() => {
    async function initIAP() {
      try {
        await RNIap.initConnection();
        console.log('IAP connection is initialized.');
        await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
      } catch (err) {
        console.warn('IAP init error:', err);
      }
      await generateAndSaveKey();

      return () => {
        RNIap.endConnection(); // Correct usage
        console.log('IAP connection is closed.');
      };
    }

    initIAP();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <MenuProvider>
        <NavigationContainer>
          <AppStack.Navigator screenOptions={{headerShown: false}}>
            {showLanding ? (
              <AppStack.Screen name="Landing" component={LandingPage} />
            ) : (
              <>
                <AppStack.Screen name="Login" component={LoginPage} />
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
            )}
          </AppStack.Navigator>
        </NavigationContainer>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}

export default App;
