import React, {useState, useEffect} from 'react';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import {Text, View, TouchableOpacity} from 'react-native';
import Nomi from './nomi';
import Chats from './chats';
import Feed from './feed';
import auth from '@react-native-firebase/auth';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import 'react-native-gesture-handler';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {createStackNavigator} from '@react-navigation/stack';
import Topbar from '../components/Topbar';

const Stack = createStackNavigator();

const Tab = createMaterialTopTabNavigator();

function FrameTabs() {
  return (
    <Tab.Navigator
      tabBarOptions={{
        upperCaseLabel: false,
        activeTintColor: Color.fCDDEC,
        inactiveTintColor: Color.gray_700,
        style: {backgroundColor: '#c599f8'},
        indicatorStyle: {backgroundColor: Color.fCDDEC},
        tabBarItem: {pressOpacity: 1},
        labelStyle: {
          fontSize: 12,
          fontFamily: FontFamily.robotoBold,
          fontWeight: '700',
          fontSize: FontSize.size_sm,
        },
      }}
      swipeEnabled={true}
      tabBarPosition="top"
      animationEnabled={true}>
      <Tab.Screen name="Nomi" component={Nomi} />
      <Tab.Screen name="Feed" component={Feed} />
      <Tab.Screen name="Chats" component={Chats} />
    </Tab.Navigator>
  );
}

function FrameTabsScreen({navigation}) {
  const signOut = async () => {
    try {
      // Sign out from Firebase
      await auth().signOut();

      // Sign out from Google Signin
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }

    navigation.navigate('Login');
  };

  const handleBuyPremium = () => {
    // This function will handle the in-app purchase process
    // Placeholder - Replace this with your in-app billing logic
    console.log('Initiating premium purchase...');
  };

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FrameTabs"
        component={FrameTabs}
        options={{
          title: 'Yunomi',
          headerStyle: {
            backgroundColor: '#c599f8',
          },
          headerTitleStyle: {
            fontSize: FontSize.size_xl,
            letterSpacing: 1,
            fontFamily: FontFamily.latoBold,
            color: Color.fCDDEC,
            fontWeight: '700',
          },
          headerRight: () => (
            <Topbar onPressBuyPremium={handleBuyPremium} signout={signOut} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

export default FrameTabsScreen;
