import React, {useRef, useState, useEffect} from 'react';
import {StyleSheet, View, Animated, PanResponder} from 'react-native';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import InputBox from '../components/inputbox';
import {LeftBubble, RightBubble} from '../components/bubbles';
import axios from 'axios';
import {ScrollView} from 'react-native';
import auth from '@react-native-firebase/auth';
import DeviceInfo from 'react-native-device-info';
import ContactCard from '../components/contact';
import {BackHandler, ToastAndroid} from 'react-native';

const Nomi = ({navigation}) => {
  const userId = auth().currentUser ? auth().currentUser.uid : null;
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const position = useRef(new Animated.Value(0)).current;
  const [activeLabel, setActiveLabel] = useState('nomi');
  const scrollViewRef = useRef(null);
  const [apiUrl, setApiUrl] = useState('');
  const [lastBackPressed, setLastBackPressed] = useState(0);

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

  const fetchBotConversation = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/fetchBotConversation/${userId}`,
      );
      const historicalMessages = response.data.messages;

      const formattedMessages = historicalMessages.map(item => {
        if (item.matched_user_id && item.display_name) {
          // Use a type property instead of storing a component
          return {
            ...item, // Spread the rest of the item properties
            type: 'contactCard', // Add a type property
          };
        }
        return item; // For other messages, return as is
      });
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching bot conversation:', error);
    }
  };

  // Use this in your useEffect
  useEffect(() => {
    if (apiUrl) {
      fetchBotConversation();
    }
  }, [apiUrl]);

  return (
    <View style={styles.page}>
      <ScrollView
        style={{flex: 1, paddingBottom: 200}}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current.scrollToEnd({animated: true})
        }>
        {messages.map((message, index) => {
          if (message.matched_user_id) {
            return (
              <>
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
              </>
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
