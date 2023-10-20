// ProfileScreen.js
import React from 'react';
import {View, ScrollView} from 'react-native';
import ProfileDetails from '../components/profiledetails';
import ChatsList from '../components/chatlist';

const ProfileScreen = () => {
  return (
    <ScrollView style={{flex: 1}}>
      <ProfileDetails />
      <ChatsList />
    </ScrollView>
  );
};

export default ProfileScreen;
