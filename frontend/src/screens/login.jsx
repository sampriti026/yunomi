import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Button,
  TextInput,
  Text,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import DateTimePicker from '@react-native-community/datetimepicker';
import {BackHandler} from 'react-native';

const API_URL = 'http://10.0.2.2:8000';

GoogleSignin.configure({
  webClientId:
    '173733886535-jvvko61hq82j9euu278a61df1hhig9vu.apps.googleusercontent.com',

  // Replace with your webClientId
});

function LoginPage({navigation}) {
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [dob, setDob] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [googleId, setGoogleId] = useState(null);

  const onGoogleButtonPress = async () => {
    try {
      const {idToken, user} = await GoogleSignin.signIn();
      const googleId = user.id;
      setGoogleId(user.id);

      let responseStatus = null;
      let responseData = null;

      await axios
        .get(`${API_URL}/check_user_exists/${googleId}/`)
        .then(response => {
          responseStatus = response.status;
          responseData = response.data;
        })
        .catch(error => {
          if (error.response) {
            responseStatus = error.response.status;
            responseData = error.response.data;
          } else {
            throw error; // If it's another kind of error, throw it so the outer catch block can handle it
          }
        });

      console.log('Response from backend:', responseStatus, responseData);

      if (responseStatus === 200) {
        console.log('User exists in the system.');
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        await auth().signInWithCredential(googleCredential);
        setMessage('Welcome back');
        navigation.navigate('FrameTabsScreen');
      } else if (responseStatus === 404) {
        console.log('User not found in the system.');
        setIsFirstTimeUser(true);
      }
    } catch (error) {
      console.error('Error in Google Sign In:', error.message);
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Firebase
      await auth().signOut();

      // Sign out from Google Signin
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();

      setMessage('Signed out successfully.');
    } catch (error) {
      console.error('Error signing out:', error.message);
      setMessage('Error during sign out. Please try again.');
    }
  };

  const submitDetails = async () => {
    if (!name || !dob || !username) {
      setMessage('Please fill out all fields before submitting.');
      return;
    }

    try {
      // Attempt to fetch the user by username
      const response = await axios.get(`${API_URL}/get_user/${username}/`);

      // If the response contains data, it means the username is already taken
      if (response.data) {
        setMessage('Username is already taken. Please choose another.');
        return;
      }
    } catch (error) {
      // Here, we catch potential errors from the axios call
      if (error.response && error.response.status === 404) {
        // A 404 means the username doesn't exist and thus can be used

        try {
          const googleIdToken = await GoogleSignin.getTokens();
          const googleCredential = auth.GoogleAuthProvider.credential(
            googleIdToken.idToken,
          );

          // Sign in to Firebase to ensure we have a Firebase user
          await auth().signInWithCredential(googleCredential);

          // Use Firebase UID as the reference
          const firebaseUID = auth().currentUser.uid;

          await axios.post(`${API_URL}/create_user/`, {
            firebase_uid: firebaseUID,
            display_name: name,
            username: username,
            dob: dob,
            bio: '',
            google_user_id: googleId,
          });

          setIsFirstTimeUser(false);
          setMessage('Welcome to the app!');
          navigation.navigate('FrameTabsScreen');
          return; // This is important, to prevent the code from executing further
        } catch (innerError) {
          if (innerError.response && innerError.response.data) {
            console.error(
              'Error during user creation:',
              innerError.response.data,
            );
          } else {
            console.error('Error during user creation:', innerError.message);
          }
          setMessage('Error during profile creation. Please try again.');
          return;
        }
      } else {
        // Handle other errors here
        console.error('Error fetching username:', error.message);
        setMessage('Error during username submission. Please try again.');
        return;
      }
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false); // close date picker after selection
    if (selectedDate) {
      setDob(
        `${selectedDate.getDate()}-${
          selectedDate.getMonth() + 1
        }-${selectedDate.getFullYear()}`,
      );
    }
  };

  useEffect(() => {
    // Add event listener for hardware back button press on Android
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => backHandler.remove();
  }, []);

  const handleBackPress = async () => {
    try {
      // Sign out from Firebase
      await auth().signOut();

      // Sign out from Google Signin
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();

      // Optionally, navigate user to a specific screen, e.g., LandingPage
      navigation.navigate('LandingPage');
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsFirstTimeUser(false);
    }
    // Return true to prevent the default back behavior
    return true;
  };

  return (
    <View style={styles.container}>
      {isFirstTimeUser ? (
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              placeholder="Date of Birth"
              value={dob}
              editable={false} // make it non-editable
              style={styles.input}
            />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode={'date'}
              is24Hour={true}
              display="default"
              onChange={onDateChange}
            />
          )}

          <TextInput
            placeholder="Enter unique username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
          <TouchableOpacity style={styles.button} onPress={submitDetails}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={onGoogleButtonPress}>
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={signOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A082D5',
  },
  inputContainer: {
    width: '80%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  input: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 30,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#7552A0', // Adjust color for better complementarity
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    margin: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  message: {
    marginTop: 20,
    color: 'white',
  },
});

export default LoginPage;

//173733886535-jvvko61hq82j9euu278a61df1hhig9vu.apps.googleusercontent.com
