// ChatScreen.js
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import InputBox from '../components/inputbox';
import {BackHandler} from 'react-native';
import {LeftBubble, RightBubble} from '../components/bubbles';
import auth from '@react-native-firebase/auth';
import DeviceInfo from 'react-native-device-info';
import {Animated} from 'react-native';
import {setActiveChatId, removeActiveChatId} from '../components/storage';

import Swipeable from 'react-native-gesture-handler/Swipeable';

const ChatScreen = ({navigation, route}) => {
  const {
    userId,
    otherUserId,
    profilePic,
    display_name,
    username,
    bio,
    isPrivate,
    conversationId,
  } = route.params;
  const [messages, setMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [apiUrl, setApiUrl] = useState('');
  const [postedMessageIds, setPostedMessageIds] = useState({}); // New state to track posted messages

  // Get the currently logged-in user's ID
  const loggedInUserId = auth().currentUser ? auth().currentUser.uid : null;
  // Check if the logged-in user is a participant in the chat
  const isParticipant =
    loggedInUserId === userId || loggedInUserId === otherUserId;

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

  const fetchUserDetails = async user => {
    try {
      const response = await fetch(`${apiUrl}/get_userDetails?user_id=${user}`);
      const userDetails = await response.json();
      return userDetails;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null; // Return null in case of an error
    }
  };

  const swipeableRefs = useRef({});

  useEffect(() => {
    // Fetch other user's details
    const fetchDetails = async () => {
      if (!apiUrl) return;
      const userDetails = await fetchUserDetails(userId);
      if (userDetails) {
        setUserDetails(userDetails);
      } else {
        console.error('Other user details not found');
        // Handle the case where other user details are not found
      }
    };

    fetchDetails();
  }, [userId, apiUrl]);

  useEffect(() => {
    // Set active chat ID when the screen is focused
    const focusListener = navigation.addListener('focus', () => {
      setActiveChatId(conversationId);
    });

    // Remove active chat ID when the screen is blurred (navigated away from)
    const blurListener = navigation.addListener('blur', () => {
      removeActiveChatId();
    });

    return () => {
      // Cleanup listeners when the component is unmounted or when navigation state changes
      navigation.removeListener('focus', focusListener);
      navigation.removeListener('blur', blurListener);
    };
  }, [navigation, conversationId]);

  useEffect(() => {
    // Fetch chat history
    const fetchChatHistory = async () => {
      try {
        if (!apiUrl || !conversationId) return;
        const response = await fetch(
          `${apiUrl}/get_chat_history?conversationId=${conversationId}&isPrivate=${isPrivate}`,
        );
        const data = await response.json();

        if (data.status === 'success') {
          setMessages(data.messages);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
    fetchChatHistory();
  }, [conversationId, apiUrl]);

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

  useEffect(() => {
    return () => {
      removeActiveChatId();
    };
  }, [conversationId]);

  const sendMessage = async text => {
    try {
      console.log(text, userId, otherUserId, conversationId);
      const response = await fetch(`${apiUrl}/send_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: otherUserId,
          text: text,
          conversation_id: conversationId,
          is_private: isPrivate,
        }),
      });

      // Assuming the response is JSON.
      const responseData = await response.json(); // Directly parse the response as JSON
      console.log(responseData, 'responseData'); // Log the parsed response data

      if (responseData.status === 'success') {
        // Update the messages state to include the new message
        setMessages(prevMessages => [
          ...prevMessages,
          {
            user_id: userId,
            text: text,
            timestamp: new Date().toISOString(), // Assuming the timestamp format is ISO string
          },
        ]);
      } else {
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const RightActions = (progress, dragX, messageId) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const postStatus = postedMessageIds[messageId];

    return (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor:
            postStatus === 'success'
              ? '#4caf50'
              : postStatus === 'failed'
              ? '#f44336'
              : '#ddd',
          justifyContent: 'center',
          transform: [{translateX: trans}],
        }}>
        <Text
          style={{color: 'black', paddingHorizontal: 10, fontWeight: '600'}}>
          {postStatus === 'success'
            ? 'Message posted to feed!'
            : postStatus === 'failed'
            ? 'Message failed to post'
            : 'Swipe left to post this message'}
        </Text>
      </Animated.View>
    );
  };

  const onMessageSwipe = async messageId => {
    swipeableRefs.current[messageId]?.close();
    try {
      console.log(messageId, 'messageId');
      const response = await fetch(`${apiUrl}/send_post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: loggedInUserId,
          message_id: messageId,
          repost: true,
          timestamp: new Date().toISOString(),
          conversationId: conversationId,
        }),
      });

      const responseData = await response.json();
      if (responseData.status === 'success') {
        console.log('Message posted successfully');
        setPostedMessageIds(prevState => ({
          ...prevState,
          [messageId]: 'success',
        }));
      } else {
        console.error('Failed to post message:', responseData.message);
        setPostedMessageIds(prevState => ({
          ...prevState,
          [messageId]: 'failed',
        }));
      }
    } catch (error) {
      console.error('Error posting message:', error);
      setPostedMessageIds(prevState => ({...prevState, [messageId]: 'failed'}));
    }
  };

  const navigateToProfile = async user => {
    const userDetails = await fetchUserDetails(user);
    if (userDetails) {
      console.log(userDetails, 'userDetails');
      navigation.navigate('ProfileScreen', {
        userId: user,
        profilePic: userDetails.profilePic, // Adjust keys as per your API response
        display_name: userDetails.display_name,
        username: userDetails.username,
        bio: userDetails.bio,
      });
    } else {
      console.error('User details not found');
      // Handle the case where user details are not found
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarSection}
          onPress={() => navigateToProfile(otherUserId)}>
          <Image
            source={{uri: profilePic || 'https://via.placeholder.com/150'}}
            style={styles.profilePhoto}
          />
          <Text style={styles.profileName}>{display_name}</Text>
        </TouchableOpacity>

        {userDetails && (
          <TouchableOpacity
            style={styles.topBarSection}
            onPress={() => navigateToProfile(userId)}>
            <Text style={styles.profileName}>{userDetails.display_name}</Text>
            <Image
              source={{
                uri:
                  userDetails.profilePic || 'https://via.placeholder.com/150',
              }}
              style={styles.profilePhoto}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
          <Swipeable
            ref={ref => (swipeableRefs.current[item.message_id] = ref)}
            renderRightActions={(progress, dragX) =>
              RightActions(progress, dragX, item.message_id)
            }
            onSwipeableClose={() => {
              // Reset the state for all messages when swipeable item is closed
              setPostedMessageIds({});
            }}
            onSwipeableOpen={direction => {
              if (direction === 'right') {
                onMessageSwipe(item.message_id);
                console.log('swiped left');
              }
            }}
            overshootLeft={false}
            friction={2}>
            {item.user_id === userId ? (
              <RightBubble text={item.text} timestamp={item.timestamp} />
            ) : (
              <LeftBubble text={item.text} timestamp={item.timestamp} />
            )}
          </Swipeable>
        )}
      />
      {isParticipant && <InputBox sendMessage={sendMessage} />}
    </View>
  );
};

// Add styles for ChatScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  messageItem: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#e0e0e0', // Light grey for message bubbles
    borderRadius: 20,
    maxWidth: '80%',
    alignSelf: 'flex-start', // Align to start for received messages
  },
  myMessageItem: {
    backgroundColor: '#4fc3f7', // Light blue for own messages
    alignSelf: 'flex-end', // Align to end for own messages
  },
  inputBoxContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ccc', // Light border for the input box area
    backgroundColor: '#fff', // White background for the input box
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#383838',
    padding: 10,
  },
  topBarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    // Ensure this takes up only the space it needs, remove flex: 1 if not necessary
  },

  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 5,
  },
  profileName: {
    fontSize: 18,
    marginRight: 7,
    color: 'white',
  },
});

export default ChatScreen;
