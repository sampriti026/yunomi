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
    const unsubscribeFromMessaging = setupForegroundMessageHandler();
    return unsubscribeFromMessaging;
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
  if (initializing) return null; // Show loading spinner here if you'd like

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <MenuProvider>
        <NavigationContainer>
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
