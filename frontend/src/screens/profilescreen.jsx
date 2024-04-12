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

const ProfileScreen = ({route, navigation}) => {
  const {userId, profilePic, display_name, username, bio} = route.params;
  const [isFabOpen, setIsFabOpen] = useState(false);

  const yourUserId = auth().currentUser ? auth().currentUser.uid : null;
  const navigateToChatScreen = params => {
    navigation.navigate('ChatScreen', params);
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
        console.log(
          `Found matching conversation with ID: ${matchingConversation.id}`,
        );
        return matchingConversation.id;
      } else {
        console.log('No matching conversation found.');
        return null;
      }
    } catch (error) {
      console.error('Error finding conversation: ', error);
      return null;
    }
  };

  const handleChatSelect = (
    otherUserId,
    display_name,
    username,
    profilePic,
    bio,
    isPrivate,
    conversationId,
  ) => {
    // Now uses navigateToChatScreen with a single argument object
    navigateToChatScreen({
      userId,
      otherUserId,
      display_name,
      username,
      profilePic,
      bio,
      isPrivate,
      conversationId,
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

  const onSendMessage = async isPrivate => {
    const conversationId = await findConversationId(
      yourUserId,
      userId,
      isPrivate,
    );

    // Also uses navigateToChatScreen with a single argument object
    console.log('OnSendMess', yourUserId, userId, isPrivate);
    navigateToChatScreen({
      userId: yourUserId,
      otherUserId: userId,
      profilePic,
      display_name,
      username,
      bio,
      isPrivate: isPrivate,
      conversationId,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <ProfileDetails
          userId={userId}
          profilePic={profilePic}
          displayName={display_name}
          username={username}
          bio={bio}
        />
        <ChatsList
          userId={userId}
          onChatSelect={handleChatSelect}
          viewOnlyPublic={userId !== yourUserId}
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
