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
import {Animated} from 'react-native';
import {setActiveChatId, removeActiveChatId} from '../components/storage';
import {encryptMessage, decryptMessage} from '../services.jsx/encrypt';
import firestore from '@react-native-firebase/firestore';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {useIsFocused} from '@react-navigation/native';
import {BlurView} from '@react-native-community/blur';
import axios from 'axios';
const ChatScreen = ({navigation, route}) => {
  const isFocused = useIsFocused(); // This hook returns true if the screen is focused, false otherwise.
  const {
    senderUserId,
    receiverUserId,
    receiverDisplayName,
    receiverUsername,
    receiverProfilePic,
    isPrivate,
    conversationId,
    index,
    viewOnlyPublic,
    senderProfilePic,
    senderDisplayName,
    senderUsername,
  } = route.params;

  const [messages, setMessages] = useState([]);
  const [postedMessageIds, setPostedMessageIds] = useState({}); // New state to track posted messages
  const [summary, setSummary] = useState('');
  // Get the currently logged-in user's ID
  const loggedInUserId = auth().currentUser ? auth().currentUser.uid : null;

  // Check if the logged-in user is a participant in the chat
  const isParticipant =
    loggedInUserId === senderUserId || loggedInUserId === receiverUserId;
  const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';

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
    if (!isFocused) return; // Check if the screen is focused
    setMessages([]); // Reset messages when focus or conversation changes
    let unsubscribeSummary;
    let unsubscribeMessages;

    const fetchConversation = async () => {
      if (viewOnlyPublic & (index > 0)) {
        const userDetails = await fetchUserDetails(loggedInUserId);
        if (!userDetails || !userDetails.premium) {
          const unsubscribeSummary = firestore()
            .collection('conversations')
            .doc(conversationId)
            .onSnapshot(documentSnapshot => {
              if (documentSnapshot.exists) {
                const data = documentSnapshot.data();
                setSummary(data.summary);
              }
            });
        }
      }

      const conversationDoc = await firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        console.log('No such conversation exists!');
        return;
      }

      const {is_private} = conversationDoc.data(); // Retrieve the isPrivate flag

      // Set up the listener for the messages subcollection
      const unsubscribeMessages = firestore()
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp')
        .onSnapshot(
          async snapshot => {
            const updates = snapshot.docs.map(doc => {
              const messageData = doc.data();
              const convertedTimestamp = messageData.timestamp.toDate(); // Convert Firestore Timestamp to JavaScript Date

              if (is_private) {
                return decryptMessage(messageData.text)
                  .then(decryptedText => ({
                    ...messageData,
                    text: decryptedText,
                    key: doc.id,
                    timestamp: convertedTimestamp,
                  }))
                  .catch(error => {
                    console.error(
                      'Decryption failed for message:',
                      doc.id,
                      error,
                    );
                    return {
                      ...messageData,
                      text: '[Decryption failed]',
                      key: doc.id,
                      timestamp: convertedTimestamp,
                    };
                  });
              } else {
                return {
                  ...messageData,
                  key: doc.id,
                  timestamp: convertedTimestamp,
                };
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

    fetchConversation().catch(error => {
      console.error('Failed to set up conversation listener:', error);
    });

    // Cleanup function
    return () => {
      if (unsubscribeSummary) unsubscribeSummary();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [isFocused, conversationId, viewOnlyPublic, index, loggedInUserId]);

  const sendMessage = async text => {
    const tempMessageId = `temp-${Date.now()}`; // Unique ID for the optimistic message
    const currentTimestamp = new Date().toISOString(); // Generate a single timestamp

    const optimisticMessage = {
      text,
      user_id: loggedInUserId,
      timestamp: currentTimestamp, // Use current date as the optimistic timestamp
      key: tempMessageId,
      status: 'sending', // Indicate that the message is in the process of being sent
    };

    // Update local state optimistically
    setMessages(prevMessages => [optimisticMessage, ...prevMessages]);

    const encryptedText = await encryptMessage(text);
    try {
      const response = await axios.post(`${apiUrl}/send_message`, {
        sender_id: loggedInUserId,
        receiver_id: receiverUserId,
        text: isPrivate ? encryptedText : text,
        conversation_id: conversationId,
        is_private: isPrivate,
        timestamp: currentTimestamp,
      });

      const endTime = performance.now();
    } catch (error) {
      console.error('Failed to send message:', error);

      // On error, update the optimistic message's status to 'failed'
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.timestamp === currentTimestamp && msg.user_id === loggedInUserId
            ? {...msg, status: 'failed'}
            : msg,
        ),
      );
    }
  };
  useEffect(() => {
    // Set active chat ID when the screen is focused
    const focusListener = navigation.addListener('focus', () => {
      if (!!conversationId) {
        setActiveChatId(conversationId);
      }
      const updateLastRead = async () => {
        const conversationRef = firestore()
          .collection('conversations')
          .doc(conversationId);
        const doc = await conversationRef.get();
        const conversationData = doc.data();

        if (conversationData) {
          const otherUserLastUpdatedTime = conversationData.last_updated[
            receiverUserId
          ]
            ? conversationData.last_updated[receiverUserId].toDate()
            : new Date(0); // Default to epoch if not set

          const userLastReadTime =
            conversationData.lastRead &&
            conversationData.lastRead[loggedInUserId]
              ? conversationData.lastRead[loggedInUserId].toDate()
              : new Date(0); // Default to epoch if not set

          // Update lastRead only if the other user's last updated time is greater than this user's last read time
          if (otherUserLastUpdatedTime > userLastReadTime) {
            await conversationRef.update({
              [`lastRead.${senderUserId}`]:
                firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      };
      updateLastRead();
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

  const navigateToProfile = (userId, profilePic, displayName, username) => {
    navigation.navigate('ProfileScreen', {
      userId: userId,
      profilePic: profilePic, // Adjust keys as per your API response
      displayName: displayName,
      username: username,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlayInfoContainer}>
        {isPrivate ? (
          <Text style={styles.overlayInfoText}>Encrypted Chat</Text>
        ) : (
          <Text style={styles.overlayInfoText}>People may read this chat</Text>
        )}
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarSection}
          onPress={() =>
            navigateToProfile(
              receiverUserId,
              receiverProfilePic,
              receiverDisplayName,
              receiverUsername,
            )
          }>
          <Image
            source={{uri: receiverProfilePic}}
            style={styles.profilePhoto}
          />
          <Text style={styles.profileName}>{receiverDisplayName}</Text>
        </TouchableOpacity>

        {senderProfilePic && (
          <TouchableOpacity
            style={styles.topBarSection}
            onPress={() =>
              navigateToProfile(
                senderUserId,
                senderProfilePic,
                senderDisplayName,
                senderUsername,
              )
            }>
            <Text style={styles.profileName}>{senderDisplayName}</Text>
            <Image
              source={{
                uri: senderProfilePic || 'https://via.placeholder.com/150',
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
                onMessageSwipe(item.key);
              }
            }}
            overshootLeft={false}
            friction={2}>
            {item.user_id === senderUserId ? (
              <RightBubble text={item.text} timestamp={item.timestamp} />
            ) : (
              <LeftBubble text={item.text} timestamp={item.timestamp} />
            )}
          </Swipeable>
        )}
      />
      {summary && (
        <>
          <BlurView style={styles.absolute} blurType="light" blurAmount={1} />
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{summary}</Text>
            <Text style={{color: 'grey'}}>Get premium to read their chat.</Text>
          </View>
        </>
      )}
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
  overlayInfoContainer: {
    position: 'absolute', // Position over your flatlist
    alignSelf: 'center', // Center horizontally
    top: '10%', // Position in the middle of the screen
    zIndex: 10, // Make sure it lays over other components
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    borderRadius: 20, // Rounded corners
    paddingVertical: 5, // Padding for the text
    paddingHorizontal: 10, // Padding for the text
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayInfoText: {
    color: 'white', // White text
    fontSize: 14, // Font size
    fontWeight: 'bold', // Bold text
  },
});

export default ChatScreen;
