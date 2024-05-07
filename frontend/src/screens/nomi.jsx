import React, {useRef, useState, useEffect} from 'react';
import {StyleSheet, View, Animated, PanResponder} from 'react-native';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import InputBox from '../components/inputbox';
import {LeftBubble, RightBubble} from '../components/bubbles';
import axios from 'axios';
import {ScrollView} from 'react-native';
import auth from '@react-native-firebase/auth';
import ContactCard from '../components/contact';
import {BackHandler, ToastAndroid} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const Nomi = ({navigation}) => {
  const userId = auth().currentUser ? auth().currentUser.uid : null;
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const position = useRef(new Animated.Value(0)).current;
  const [activeLabel, setActiveLabel] = useState('nomi');
  const scrollViewRef = useRef(null);
  const [lastBackPressed, setLastBackPressed] = useState(0);

  const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';

  useEffect(() => {
    // Function to handle back button press
    const backAction = () => {
      const now = Date.now();
      // Check if the back button was pressed twice within 2 seconds
      if (lastBackPressed && now - lastBackPressed <= 2000) {
        BackHandler.exitApp();
        return true;
      }
      // Update the last back press timestamp and show the toast
      setLastBackPressed(now);
      ToastAndroid.show('Press again to exit', ToastAndroid.SHORT);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [lastBackPressed]);

  const sendBotMessage = async (userInput, selectedOption = null) => {
    const userMessage = {
      from_bot: false,
      text: selectedOption || userInput,
      timestamp: new Date().toISOString(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      const response = await axios.post(`${apiUrl}/receive_message`, {
        user_id: userId,
        text: userInput,
      });

      if (response.data && response.data.length > 0) {
        // Directly add the new messages from the response to the state
        const newMessages = response.data.map(item => ({
          ...item, // Spread all properties from the item
          timestamp: new Date().toISOString(), // Ensure each message has a timestamp
          from_bot: true, // Mark as from the bot, assuming all responses are bot messages
        }));

        setMessages(prevMessages => [...prevMessages, ...newMessages]);
      }

      setUserInput(''); // Clear the user input
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally handle the message removal or error display
    }
  };

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

  const navigateChatscreen = async user => {
    const userDetails = await fetchUserDetails(user);
    if (userDetails) {
      navigation.navigate('ProfileScreen', {
        userId: userId,
        profilePic: userDetails.profilePic, // Adjust keys as per your API response
        display_name: userDetails.display_name,
        username: userDetails.username,
      });
    } else {
      console.error('User details not found');
      // Handle the case where user details are not found
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      position.setOffset(position._value);
      position.setValue(0);
    },
    onPanResponderMove: (event, gestureState) => {
      position.setValue(-gestureState.dx);
    },
    onPanResponderRelease: () => {
      position.flattenOffset();

      const thirdWidth = 400 / 3; // given your frameChildLayout width is 430
      const midFirst = thirdWidth / 2;
      const midSecond = thirdWidth + midFirst;

      if (position._value < midFirst) {
        setActiveLabel('subtitle');
        Animated.timing(position, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else if (position._value >= midFirst && position._value < midSecond) {
        setActiveLabel('nomi');
        Animated.timing(position, {
          toValue: thirdWidth,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        setActiveLabel('chats');
        Animated.timing(position, {
          toValue: 2 * thirdWidth,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const fetchBotConversation = async userId => {
    try {
      // Generate the user-bot conversation ID
      const conversationId = `${userId}_bot`;

      // Fetch all messages for the given conversation ID
      const messagesQuery = firestore()
        .collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp');
      const snapshot = await messagesQuery.get();

      const historicalMessages = snapshot.docs.map(doc => doc.data());

      // Check if there are messages
      if (historicalMessages.length === 0) {
        return; // Or handle this case as needed
      }

      // Process messages if any additional logic is needed
      const formattedMessages = historicalMessages.map(item => {
        if (item.matched_user_id && item.display_name) {
          return {
            ...item,
            type: 'contactCard',
          };
        }
        return item;
      });

      setMessages(formattedMessages); // Assuming setMessages is your state updater for messages
    } catch (error) {
      console.error('Error fetching bot conversation from Firestore:', error);
    }
  };

  // Usage in useEffect
  useEffect(() => {
    if (userId) {
      // Ensure userId is available
      fetchBotConversation(userId);
    }
  }, [userId]); // Dependency on userId if it might change

  return (
    <View style={styles.page}>
      <ScrollView
        style={{flex: 1, paddingBottom: 200}}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current.scrollToEnd({animated: true})
        }>
        <LeftBubble text="looking for someone who would be interested in you?" />
        <LeftBubble text="tell me something about yourself along with who you wanna connect in a single message, i will do some magic." />
        <LeftBubble text="for eg - 'hey i am 21 year old gamer looking for people who live in europe and would love to play CoD with me'" />
        <LeftBubble text="or maybe - 'I realised that i resort to fantasizing about hardwork without doing the work. anyone i can connect to someone who will help me with this?'" />

        {messages.map((message, index) => {
          if (message.matched_user_id) {
            return (
              <React.Fragment key={`message-${index}`}>
                <LeftBubble
                  key={`leftBubble-${index}`} // Ensure unique key by appending a string
                  text={message.text}
                  timestamp={message.timestamp}
                />
                <ContactCard
                  key={index}
                  displayName={message.display_name}
                  onCardClick={() =>
                    navigateChatscreen(message.matched_user_id)
                  }
                  logoUri={message.profilePic}
                />
              </React.Fragment>
            );
          } else if (message.from_bot && !message.matched_user_id) {
            return (
              <LeftBubble
                key={index}
                text={message.text}
                timestamp={message.timestamp}
              />
            );
          } else {
            return (
              <RightBubble
                key={index}
                text={message.text}
                timestamp={message.timestamp}
              />
            );
          }
        })}
        <View style={{height: 70}} />
      </ScrollView>

      <View style={styles.textboxContainer}>
        <InputBox sendMessage={sendBotMessage} />
      </View>
    </View>
  );
};

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

export default Nomi;
