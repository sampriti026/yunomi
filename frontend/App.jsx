import React, {useState, useEffect} from 'react';
import LandingPage from './src/screens/landing';
import LoginPage from './src/screens/login';
import {Color, FontFamily, FontSize} from './globalstyles';
import Nomi from './src/screens/nomi';
import Chats from './src/screens/chats';
import Feed from './src/screens/feed';
import FrameTabsScreen from './src/screens/frametabs';
import auth from '@react-native-firebase/auth';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import 'react-native-gesture-handler';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/FontAwesome';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

enableScreens();

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isProfile, setIsProfile] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setIsSignedIn(!!user);
    });

    const timer = setTimeout(() => {
      setShowLanding(false);
    }, 30);

    return () => {
      subscriber();
      clearTimeout(timer);
    };
  }, []);

  const Tab = createMaterialTopTabNavigator();

  return (
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
            </>
          )}
        </AppStack.Navigator>
      </NavigationContainer>
    </MenuProvider>
  );
}

export default App;
