import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
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
    isPrivate,
    conversationId,
    index,
  ) => {
    // Extract chatId and other participant's ID

    // Navigate to ChatScreen with chatId and userId
    navigation.navigate('ChatScreen', {
      userId,
      otherUserId,
      display_name,
      username,
      profilePic,
      isPrivate,
      conversationId,
      index,
      viewOnlyPublic: false,
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
      <ScrollView style={styles.page}>
        <ChatsList
          key="chats-chatslist" // Unique key for the instance in Chats
          userId={userId}
          onChatSelect={handleChatSelect}
          viewOnlyPublic={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#202020',
    flex: 1,
  },
});

export default Chats;
