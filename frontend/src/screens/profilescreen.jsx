// ProfileScreen.js
import React, {useState, useEffect} from 'react';
import {ScrollView, View} from 'react-native';
import {StyleSheet} from 'react-native';
import ProfileDetails from '../components/profiledetails';
import ChatsList from '../components/chatlist';
import auth from '@react-native-firebase/auth';
import ExpandableFAB from '../components/fab';
import {BackHandler} from 'react-native';

const ProfileScreen = ({route, navigation}) => {
  const {userId, profilePic, display_name, username, bio} = route.params;
  const [isFabOpen, setIsFabOpen] = useState(false);

  const yourUserId = auth().currentUser ? auth().currentUser.uid : null;
  const navigateToChatScreen = params => {
    navigation.navigate('ChatScreen', params);
  };

  const handleChatSelect = (
    otherUserId,
    display_name,
    username,
    profilePic,
    bio,
  ) => {
    // Now uses navigateToChatScreen with a single argument object
    navigateToChatScreen({
      userId,
      otherUserId,
      display_name,
      username,
      profilePic,
      bio,
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

  const onSendMessage = isPrivate => {
    // Also uses navigateToChatScreen with a single argument object
    console.log('OnSendMess', isPrivate);
    navigateToChatScreen({
      userId: yourUserId, // Assuming yourUserId is defined elsewhere in your component
      otherUserId: userId, // Assuming userId is defined elsewhere in your component
      profilePic,
      display_name,
      username,
      bio,
      isPrivate: isPrivate,
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
