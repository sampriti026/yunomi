import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import LoginPage from './screens/login';
import FrameScreen from './screens/nomi';
import ChatScreen from './screens/chatscreen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

// Import other screens if needed

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

const AppNavigation = ({isSignedIn}) => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        {isSignedIn ? (
          <AppStack.Navigator>
            <AppStack.Screen name="FrameScreen" component={FrameScreen} />
            <AppStack.Screen name="ChatScreen" component={ChatScreen} />
          </AppStack.Navigator>
        ) : (
          <AuthStack.Navigator>
            <AuthStack.Screen name="Login" component={LoginPage} />
            {/* other auth screens */}
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default AppNavigation;
