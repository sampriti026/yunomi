import React, {useState, useEffect} from 'react';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import Nomi from './nomi';
import Chats from './chats';
import Feed from './feed';
import auth from '@react-native-firebase/auth';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import 'react-native-gesture-handler';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/FontAwesome';
import {createStackNavigator} from '@react-navigation/stack';

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
            <Menu>
              <MenuTrigger>
                <Icon
                  name="ellipsis-v"
                  size={20}
                  color={Color.fCDDEC}
                  style={{marginRight: 15}}
                />
              </MenuTrigger>
              <MenuOptions>
                <MenuOption onSelect={() => signOut()} text="Sign Out" />
              </MenuOptions>
            </Menu>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

export default FrameTabsScreen;
