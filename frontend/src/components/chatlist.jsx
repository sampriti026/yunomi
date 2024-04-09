// ChatsList.js
import React, {useState, useEffect} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import Icon from react-native-vector-icons
import firestore from '@react-native-firebase/firestore';
import {decryptMessage} from '../services.jsx/encrypt';

const ChatsList = ({onChatSelect, userId, viewOnlyPublic = false}) => {
  const [chats, setChats] = useState([]);
  const [apiUrl, setApiUrl] = useState('');

  async function isEmulator() {
    return await DeviceInfo.isEmulator();
  }

  useEffect(() => {
    const initializeApiUrl = async () => {
      const API_URL_EMULATOR = 'http://10.0.2.2:8000';
      const API_URL_DEVICE = 'http://192.168.0.104';

      const url = (await isEmulator()) ? API_URL_EMULATOR : API_URL_DEVICE;
      setApiUrl(url); // Set the state
    };

    initializeApiUrl();
  }, []);

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

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('conversations')
      .where('participants', 'array-contains', userId)
      .orderBy('last_updated', 'desc')
      .onSnapshot(async querySnapshot => {
        const chatsPromises = querySnapshot.docs.map(async doc => {
          const data = doc.data();
          const participantDetails = await Promise.all(
            data.participants.map(fetchUserDetails),
          );

          // Assuming `last_message` is encrypted and needs decryption for private chats
          return {
            conversation_id: doc.id,
            last_message: data.is_private
              ? decryptMessage(data.last_message)
              : data.last_message,
            last_updated: data.last_updated,
            participants: participantDetails.filter(Boolean), // Remove any nulls
            is_private: data.is_private,
          };
        });

        const updatedChats = await Promise.all(chatsPromises);
        setChats(updatedChats);
      });

    return () => unsubscribe();
  }, [userId]);

  return (
    <View>
      {chats.map(chat => {
        const otherUser = chat.participants.find(p => p.userId !== userId);
        const isPrivate = chat.is_private;
        let chatLastMessage; // Declare variable without initial value
        if (isPrivate) {
          chatLastMessage = decryptMessage(chat.last_message);
        } else {
          chatLastMessage = chat.last_message; // Directly use chat.chatLastMessage if not private
        }
        return (
          <TouchableOpacity
            key={chat.conversation_id}
            onPress={() =>
              onChatSelect(
                otherUser.userId,
                otherUser.display_name,
                otherUser.username,
                otherUser.profilePic,
                otherUser.bio,
                isPrivate,
                chat.conversation_id,
                otherUser.dob,
              )
            }>
            <View style={styles.chatItem}>
              {/* Assuming you have a profile image URL in your user details */}
              <Image
                source={{
                  uri:
                    otherUser.profilePic || 'https://via.placeholder.com/150',
                }}
                style={styles.dp}
              />
              <View style={styles.chatTextContainer}>
                <Text style={styles.chatName}>{otherUser.display_name}</Text>
                <Text style={styles.chatUsername}>@{otherUser.username}</Text>
                <Text style={styles.chatLastMessage}>{chatLastMessage}</Text>
                {chat.is_private && (
                  <Icon
                    name="lock"
                    size={40}
                    color="#FFFFFF"
                    style={styles.lockIcon}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Add styles for ChatsList here
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  dp: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  chatTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF', // Changed to white
  },
  chatUsername: {
    fontSize: 14,
    color: '#FFFFFF', // Changed to white
  },
  lockIcon: {
    position: 'absolute',
    right: 0,
    top: '30%',
    transform: [{translateY: -7}], // Adjust based on your layout
  },

  chatLastMessage: {
    fontSize: 14,
    color: 'grey',
    paddingTop: 5,
  },
});

export default ChatsList;
