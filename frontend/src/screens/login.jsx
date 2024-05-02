import React, {useState, useEffect} from 'react';
import {StyleSheet, TouchableOpacity, View, Text} from 'react-native';
import axios from 'axios';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {BackHandler} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import MultiStepForm from '../components/Multistepform';
import EmailPasswordLoginForm from '../components/emailpassword';
import {updateFcmToken} from '../components/updatefcm';

GoogleSignin.configure({
  webClientId:
    '173733886535-jvvko61hq82j9euu278a61df1hhig9vu.apps.googleusercontent.com',
  // Replace with your webClientId
});

function LoginPage({navigation}) {
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [message, setMessage] = useState('');
  const [googleId, setGoogleId] = useState(null);
  const [firebaseUid, setFirebaseUid] = useState('');
  const [isSignUpViaGoogle, setIsSignUpViaGoogle] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset states when the login screen is focused
      setShowEmailLogin(false);
      setMessage('');
    });

    return unsubscribe;
  }, [navigation]);

  const onGoogleButtonPress = async () => {
    try {
      await GoogleSignin.signOut(); // Sign out before signing in
      const {idToken, user} = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      const userCredential = await auth().signInWithCredential(
        googleCredential,
      );

      setFirebaseUid(userCredential.user.uid);
      setEmail(userCredential.user.email); // Get the user's email address

      const usersRef = firestore().collection('users');
      const doc = await usersRef.doc(userCredential.user.uid).get();

      if (doc.exists) {
        setMessage('Welcome back');
        navigation.navigate('FrameTabsScreen');
        await updateFcmToken(userCredential.user.uid);
      } else {
        setIsFirstTimeUser(true);
        setIsSignUpViaGoogle(true);
      }
    } catch (error) {
      console.error('Error in Google Sign In:', error);
    }
  };

  const onDirectSignUpPress = () => {
    setIsFirstTimeUser(true);
    setIsSignUpViaGoogle(false); // Explicitly mark as not signing up via Google
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

      setShowEmailLogin(false);
      navigation.navigate('LandingPage');
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsFirstTimeUser(false);
    }
    // Return true to prevent the default back behavior
    return true;
  };

  const onLoginWithEmailPress = async () => {
    setShowEmailLogin(true);
  };

  return (
    <View style={styles.container}>
      {!isFirstTimeUser && !showEmailLogin ? (
        <>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={onGoogleButtonPress}>
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={onDirectSignUpPress}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={onLoginWithEmailPress}>
              <Text style={styles.buttonText}>
                Login with Email and Password
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : showEmailLogin ? (
        <EmailPasswordLoginForm
          setMessage={setMessage}
          navigation={navigation}
          apiUrl={apiUrl}
        />
      ) : (
        <MultiStepForm
          apiUrl={apiUrl}
          setMessage={setMessage}
          navigation={navigation}
          isSignUpViaGoogle={isSignUpViaGoogle}
          googleId={googleId}
          firebaseUid={firebaseUid}
          email={email}
        />
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
    flexDirection: 'column',
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
    position: 'absolute',
    bottom: 200,
  },
});

export default LoginPage;

//173733886535-jvvko61hq82j9euu278a61df1hhig9vu.apps.googleusercontent.com
