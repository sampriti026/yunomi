import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import LoginPage from './screens/login';
import FrameScreen from './screens/nomi';
// Import other screens if needed

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

const AppNavigation = ({isSignedIn}) => {
  return (
    <NavigationContainer>
      {isSignedIn ? (
        <AppStack.Navigator>
          <AppStack.Screen name="FrameScreen" component={FrameScreen} />
          {/* other app screens */}
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator>
          <AuthStack.Screen name="Login" component={LoginPage} />
          {/* other auth screens */}
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigation;
