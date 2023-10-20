import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  PanResponder,
  Button,
} from 'react-native';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import InputBox from '../components/inputbox';
import {LeftBubble, RightBubble} from '../components/bubbles';
import axios from 'axios';
import {ScrollView} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Modal, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import Profile from '../components/profile';
import photo from '../assets/photo.png';

const Nomi = ({navigation}) => {
  const userId = auth().currentUser ? auth().currentUser.uid : null;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const position = useRef(new Animated.Value(0)).current;
  const [activeLabel, setActiveLabel] = useState('nomi');
  const scrollViewRef = useRef(null);

  const API_URL = 'http://10.0.2.2:8000';

  const fetchData = async () => {
    // Replace with the actual user ID
    const message = {
      user_id: userId,
      text: userInput,
    };

    try {
      // Fetch existing messages from Firestore
      const querySnapshot = await firestore()
        .collection('conversations')
        .doc(userId)
        .collection('messages')
        .orderBy('timestamp')
        .get();
      const historicalMessages = querySnapshot.docs.map(doc => doc.data());
      setMessages(historicalMessages);
      console.log('UserId:', userId);

      // // Send initial message to bot (if needed)
      // const response = await axios.post(`${API_URL}/start_conversation`, message);
      // if (response.data.status === 'success') {
      //   // handle the logic for bot's introductory messages if necessary...
      // }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const contact = {
    name: 'Sampriti',
    dp: photo, // Replace with actual image URL
  };

  const handlePress = () => {
    navigation.navigate('Profile'); // Replace 'AnotherScreen' with the name of the screen you want to navigate to
  };

  const signOut = async () => {
    try {
      // Sign out from Firebase
      await auth().signOut();

      // Sign out from Google Signin
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }

    navigation.navigate('Login');
  };

  useEffect(() => {
    fetchBotConversation(); // This function will call the /start_conversation endpoint when the component mounts
  }, []);

  const sendMessage = async (userInput, selectedOption = null) => {
    const message = {
      user_id: userId,
      text: userInput,
    };

    try {
      const response = await axios.post(`${API_URL}/receive_message`, message);

      // Add the user's message to the chat list
      const userMessage = {
        from_bot: false,
        text: selectedOption || userInput,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Add bot's response to the chat list
      const botMessage = {
        from_bot: true,
        text: response.data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Clear the user input
      setUserInput('');

      // Save messages to Firestore
      const userId = userId; // replace with your actual user ID
      await firestore()
        .collection('conversations')
        .doc(userId)
        .collection('messages')
        .add(userMessage);
      await firestore()
        .collection('conversations')
        .doc(userId)
        .collection('messages')
        .add(botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendBotMessage = async (userInput, selectedOption = null) => {
    const message = {
      user_id: userId,
      text: userInput,
    };
    console.log(userId, userInput, 'userid ');

    try {
      const response = await axios.post(`${API_URL}/receive_message`, message);

      // Add the user's message to the chat list
      const userMessage = {
        from_bot: false,
        text: selectedOption || userInput,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Add bot's response to the chat list
      const botMessage = {
        from_bot: true,
        text: response.data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Clear the user input
      setUserInput('');

      // Save messages to Firestore within the user's 'bot_conversation'
    } catch (error) {
      console.error('Error sending message:', error);
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
    console.log(userId, 'userId');
    try {
      const response = await axios.get(
        `${API_URL}/fetchBotConversation/${userId}`,
      );
      const historicalMessages = response.data.messages;
      setMessages(historicalMessages);
    } catch (error) {
      console.error('Error fetching bot conversation:', error);
    }
  };

  // Use this in your useEffect
  useEffect(() => {
    fetchBotConversation();
  }, []);

  return (
    <View style={styles.page}>
      {
        <ScrollView
          style={{flex: 1, paddingBottom: 200}}
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current.scrollToEnd({animated: true})
          }>
          {messages.map((message, index) => {
            if (message.from_bot) {
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
      }

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
