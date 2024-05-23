// ProfileScreen.js
import React, {useState, useEffect} from 'react';
import {ScrollView, View} from 'react-native';
import {StyleSheet} from 'react-native';
import ProfileDetails from '../components/profiledetails';
import ChatsList from '../components/chatlist';
import auth from '@react-native-firebase/auth';
import ExpandableFAB from '../components/fab';
import {BackHandler} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import fetchUserDetails from '../services.jsx/fetchUser';

const ProfileScreen = ({route, navigation}) => {
  const {userId, profilePic, displayName, username} = route.params;

  const yourUserId = auth().currentUser ? auth().currentUser.uid : null;
  const navigateToChatScreen = params => {
    navigation.push('ChatScreen', params);
  };
  const findConversationId = async (userId, otherUserId, isPrivate) => {
    try {
      // Query conversations that include the current user and match the privacy setting
      const querySnapshot = await firestore()
        .collection('conversations')
        .where('participants', 'array-contains', userId)
        .where('is_private', '==', isPrivate)
        .get();

      // Filter the conversations further to find one that includes both the specified participants only
      const matchingConversation = querySnapshot.docs.find(doc => {
        const data = doc.data();
        const {participants} = data;
        // Check if the participants array includes both userId and otherUserId and no others
        return participants.includes(otherUserId) && participants.length === 2;
      });

      // If a matching conversation is found, return its ID
      if (matchingConversation) {
        return matchingConversation.id;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error finding conversation: ', error);
      return null;
    }
  };

  const handleChatSelect = (
    receiverUserId,
    receiverDisplayName,
    receiverUsername,
    receiverProfilePic,
    isPrivate,
    conversationId,
    index,
  ) => {
    navigateToChatScreen({
      senderUserId: userId,
      receiverUserId,
      receiverDisplayName,
      receiverUsername,
      receiverProfilePic,
      isPrivate,
      conversationId,
      index,
      viewOnlyPublic: true,
      senderProfilePic: profilePic,
      senderDisplayName: displayName,
      senderUsername: username,
    });
  };

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true; // Prevent default behavior (exiting the app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const onSendMessage = async (isPrivate, viewOnlyPublic) => {
    const conversationId = await findConversationId(
      yourUserId,
      userId,
      isPrivate,
    );
    const details = await fetchUserDetails(yourUserId);
    // Also uses navigateToChatScreen with a single argument object
    navigateToChatScreen({
      senderUserId: yourUserId,
      receiverUserId: userId,
      receiverProfilePic: profilePic,
      receiverDisplayName: displayName,
      receiverUsername: username,
      index: 0,
      isPrivate,
      conversationId,
      viewOnlyPublic,
      senderDisplayName: details.display_name,
      senderProfilePic: details.profilePic,
      senderUsername: details.username,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <ProfileDetails
          userId={userId}
          profilePic={profilePic}
          displayName={displayName}
          username={username}
        />
        <ChatsList
          key="profile-chatslist"
          userId={userId}
          onChatSelect={handleChatSelect}
          viewOnlyPublic={true}
        />
      </ScrollView>
      <ExpandableFAB onSendMessage={onSendMessage} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default ProfileScreen;
