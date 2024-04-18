import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import ChatsList from '../components/chatlist';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

function Chats({navigation}) {
  const userId = auth().currentUser ? auth().currentUser.uid : null;

  const handleChatSelect = async (
    otherUserId,
    display_name,
    username,
    profilePic,
    bio,
    isPrivate,
    conversationId,
  ) => {
    // Extract chatId and other participant's ID

    // Navigate to ChatScreen with chatId and userId
    navigation.navigate('ChatScreen', {
      userId,
      otherUserId,
      display_name,
      username,
      profilePic,
      bio,
      isPrivate,
      conversationId,
    });

    const conversationRef = firestore()
      .collection('conversations')
      .doc(conversationId);
    await conversationRef.update({
      [`lastRead.${userId}`]: firestore.FieldValue.serverTimestamp(),
    });
  };

  return (
    <View style={styles.page}>
      <ChatsList userId={userId} onChatSelect={handleChatSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },

  iconContainer: {
    // Add some spacing to the left of the icon
    position: 'absolute',
    top: 2,
    left: 8,
  },

  page: {
    backgroundColor: '#202020',
    flex: 1,
  },
  frameChildLayout: {
    height: 71,
    width: 410,
    backgroundColor: '#BB86FC',
    flexDirection: 'column',
    alignItems: 'center',
  },
  textboxContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // You can add padding here if needed
  },
  textContainer: {
    flexDirection: 'row',
    top: 20,
    width: '100%', // Ensures the container takes the full width of the parent
  },

  chatsTypo: {
    color: Color.gray_700,
    textAlign: 'center',
    fontFamily: FontFamily.robotoBold,
    fontWeight: '700',
    left: 20,
    justifyContent: 'space-evenly',
    fontSize: FontSize.size_sm,
  },
  iconLayout: {
    height: 17,
    width: 22,
    position: 'absolute',
  },
  frameChild: {
    top: 0,
    left: 0,
    position: 'absolute',
  },

  cameraIcon: {
    left: 326,
    width: 20,
    height: 15,
    top: 5,
    position: 'absolute',
  },
  menuVerticalIcon: {
    left: 394,
    top: 4,
  },
  searchIcon: {
    left: 361,
    top: 5,
  },
});

export default Chats;
