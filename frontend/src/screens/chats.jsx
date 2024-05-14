import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import ChatsList from '../components/chatlist';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const Chats = ({navigation}) => {
  const loggedinUserId = auth().currentUser ? auth().currentUser.uid : null;

  const fetchUserDetails = async participantId => {
    // Placeholder function to fetch user details from Firestore
    const userDoc = await firestore()
      .collection('users')
      .doc(participantId)
      .get();
    if (userDoc.exists) {
      return {userId: participantId, ...userDoc.data()}; // Include additional user details as needed
    }
    return null;
  };

  const handleChatSelect = async (
    otherUserId,
    display_name,
    username,
    profilePic,
    isPrivate,
    conversationId,
    index,
  ) => {
    const userDetails = await fetchUserDetails(loggedinUserId);
    const senderDisplayName = userDetails.display_name; // Ensure these match the Firestore document fields
    const senderProfilePic = userDetails.profilePic;
    const senderUsername = userDetails.username;
    // Extract chatId and other participant's ID

    // Navigate to ChatScreen with chatId and userId
    navigation.navigate('ChatScreen', {
      senderUserId: loggedinUserId,
      receiverUserId: otherUserId,
      receiverDisplayName: display_name,
      receiverUsername: username,
      receiverProfilePic: profilePic,
      isPrivate,
      conversationId,
      index,
      viewOnlyPublic: false,
      senderProfilePic,
      senderDisplayName,
      senderUsername,
    });
  };

  return (
    <View style={styles.page}>
      <ScrollView style={styles.page}>
        <ChatsList
          key="chats-chatslist" // Unique key for the instance in Chats
          userId={loggedinUserId}
          onChatSelect={handleChatSelect}
          viewOnlyPublic={false}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#202020',
    flex: 1,
  },
});

export default Chats;
