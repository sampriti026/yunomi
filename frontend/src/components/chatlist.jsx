// ChatsList.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import Icon from react-native-vector-icons

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

  useEffect(() => {
    const fetchChats = async () => {
      if (!apiUrl) return;
      try {
        const response = await fetch(
          `${apiUrl}/get_chatlist?user_id=${userId}`,
        );
        const data = await response.json();
        if (data && data.length > 0) {
          let filteredChats = data;
          // If viewing someone else's profile, filter out private chats
          if (viewOnlyPublic) {
            filteredChats = data.filter(chat => !chat.is_private);
          }
          setChats(filteredChats);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, [userId, apiUrl]);

  return (
    <View>
      {chats.map(chat => {
        const otherUser = chat.participants.find(p => p.user_id !== userId);
        const isPrivate = chat.is_private;
        return (
          <TouchableOpacity
            key={chat.conversation_id}
            onPress={() =>
              onChatSelect(
                otherUser.user_id,
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
                <Text style={styles.chatLastMessage}>{chat.last_message}</Text>
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
