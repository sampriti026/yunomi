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
import {encryptAndCombine, decryptCombined} from '../services.jsx/encrypt';
import firestore from '@react-native-firebase/firestore';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {useIsFocused} from '@react-navigation/native';
import {BlurView} from '@react-native-community/blur'; // Import BlurView

const ChatScreen = ({navigation, route}) => {
  const isFocused = useIsFocused(); // This hook returns true if the screen is focused, false otherwise.

  const {
    userId,
    otherUserId,
    profilePic,
    display_name,

    isPrivate,
    conversationId,
    index,
    viewOnlyPublic,
  } = route.params;
  const [messages, setMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [postedMessageIds, setPostedMessageIds] = useState({}); // New state to track posted messages
  const [summary, setSummary] = useState('');

  // Get the currently logged-in user's ID
  const loggedInUserId = auth().currentUser ? auth().currentUser.uid : null;
  // Check if the logged-in user is a participant in the chat
  const isParticipant =
    loggedInUserId === userId || loggedInUserId === otherUserId;

  async function isEmulator() {
    return await DeviceInfo.isEmulator();
  }
  const apiUrl = 'http://10.0.2.2:8000';
  const updateLastRead = () => {
    const conversationRef = firestore()
      .collection('conversations')
      .doc(conversationId);
    conversationRef.update({
      [`lastRead.${userId}`]: firestore.FieldValue.serverTimestamp(),
    });
  };
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

  const swipeableRefs = useRef({});

  useEffect(() => {
    // Fetch other user's details
    const fetchDetails = async () => {
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
    if (!isFocused) return; // Check if the screen is focused and conversationId is valid
    setMessages([]);

    // Define the fetchConversation function to get the conversation details and set up the listener
    const fetchConversation = async () => {
      if (viewOnlyPublic && index > 0) {
        const userDetails = await fetchUserDetails(loggedInUserId);
        if (userDetails && userDetails.premium) {
        } else {
          const unsubscribe = firestore()
            .collection('conversations')
            .doc(conversationId)
            .onSnapshot(documentSnapshot => {
              if (documentSnapshot.exists) {
                const data = documentSnapshot.data();
                setSummary(data.summary || '');
              }
            });
        }
      }
      const conversationDoc = await firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        return;
      }

      const {is_private} = conversationDoc.data(); // Retrieve the isPrivate flag

      // Set up the listener for the messages subcollection
      return firestore()
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp')
        .onSnapshot(
          async snapshot => {
            const updates = snapshot.docs.map(async doc => {
              const messageData = doc.data();
              const convertedTimestamp = messageData.timestamp.toDate(); // Convert Firestore Timestamp to JavaScript Date

              if (is_private) {
                return decryptCombined(messageData.text)
                  .then(decryptedText => {
                    return {
                      ...messageData,
                      text: decryptedText,
                      key: doc.id,
                      timestamp: convertedTimestamp,
                    };
                  })
                  .catch(error => {
                    console.error(
                      'Decryption failed for message:',
                      doc.id,
                      error,
                      messageData.text,
                    );
                    return {
                      ...messageData,
                      text: '[Decryption failed]',
                      key: doc.id,
                    };
                  });
              } else {
                return Promise.resolve({
                  ...messageData,
                  key: doc.id,
                  timestamp: messageData.timestamp.toDate(),
                });
              }
            });

            const fetchedMessages = await Promise.all(updates);
            setMessages(
              fetchedMessages.sort((a, b) => b.timestamp - a.timestamp),
            );
          },
          error => {
            console.error('Error fetching messages:', error);
          },
        );
    };
    let unsubscribeConversation;
    fetchConversation()
      .then(unsubscribe => {
        unsubscribeConversation = unsubscribe;
      })
      .catch(error => {
        console.error('Failed to set up conversation listener:', error);
      });

    // Cleanup function
    return () => {
      if (unsubscribeConversation) {
        unsubscribeConversation();
      }
    };
  }, [conversationId, viewOnlyPublic]);

  useEffect(() => {
    // Set active chat ID when the screen is focused
    const focusListener = navigation.addListener('focus', () => {
      setActiveChatId(conversationId);
      updateLastRead();
    });

    // Remove active chat ID when the screen is blurred (navigated away from)
    const blurListener = navigation.addListener('blur', () => {
      removeActiveChatId();
      updateLastRead();
    });

    return () => {
      // Cleanup listeners when the component is unmounted or when navigation state changes
      navigation.removeListener('focus', focusListener);
      navigation.removeListener('blur', blurListener);
    };
  }, [navigation, conversationId]);

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
    //lGKQ1fkiRQu9BjF3AwfFM/UmI82sAmxa:e8ICPNFCdpbhxvc+qQmHjmMQ+Nvb
    encryptedText = await encryptAndCombine(text);

    try {
      const response = await fetch(`${apiUrl}/send_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: otherUserId,
          text: isPrivate ? encryptedText : text,
          conversation_id: conversationId,
          is_private: isPrivate,
        }),
      });
      const responseData = await response.json();
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
        if (
          responseData.detail ===
          'Cannot start a new conversation due to restrictions.'
        ) {
          Alert.alert(
            'Subscription Required',
            'Gotta subscribe for premium to send more than three private messages in a week.',
            [{text: 'OK', onPress: () => console.log('OK Pressed')}],
          );
        } else {
          console.error('Error sending message:', responseData.detail);
        }
      }
    } catch (error) {
      if (
        error.message === 'Cannot start a new conversation due to restrictions.'
      ) {
        Alert.alert(
          'Subscription Required',
          'Gotta subscribe for premium to send more than three private messages in a week.',
          [{text: 'OK', onPress: () => console.log('OK Pressed')}],
        );
      }
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
          <Image source={{uri: profilePic}} style={styles.profilePhoto} />
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
        inverted
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
      {summary && (
        <>
          <BlurView style={styles.absolute} blurType="light" blurAmount={1} />
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        </>
      )}
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
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  summaryContainer: {
    position: 'absolute',
    bottom: 100, // Adjust the gap from the bottom as needed
    alignSelf: 'center',
    backgroundColor: 'white', // Semi-transparent black
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 50, // To keep the text short and not span the entire screen width
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  summaryText: {
    color: 'black',
    fontSize: 14, // Smaller font size for the summary
    textAlign: 'justified',
  },
});

export default ChatScreen;
