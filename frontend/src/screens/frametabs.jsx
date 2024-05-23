import React from 'react';
import Nomi from './nomi';
import Chats from './chats';
import Feed from './feed';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import 'react-native-gesture-handler';

const Tab = createMaterialTopTabNavigator();

export function FrameTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#c599f8',
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontFamily: 'Roboto-Bold',
          fontWeight: '700',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarIndicatorStyle: {
          backgroundColor: '#fff',
        },
      }}
      tabBarPosition="top"
      animationEnabled={true}>
      <Tab.Screen
        name="Nomi"
        component={Nomi}
        listeners={{
          tabPress: e => {},
        }}
      />
      <Tab.Screen name="Feed" component={Feed} />
      <Tab.Screen name="Chats" component={Chats} />
    </Tab.Navigator>
  );
}
