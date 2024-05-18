import React, {useState, useEffect} from 'react';
import {StyleSheet, TouchableOpacity, View, Text} from 'react-native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {BackHandler} from 'react-native';
import auth from '@react-native-firebase/auth';
import MultiStepForm from '../components/Multistepform';
import EmailPasswordLoginForm from '../components/emailpassword';
import {updateFcmToken} from '../components/updatefcm';
import {useAuth} from '../../authcontext';

GoogleSignin.configure({
  webClientId:
    '173733886535-jvvko61hq82j9euu278a61df1hhig9vu.apps.googleusercontent.com',
  // Replace with your webClientId
});

function LoginPage({navigation}) {
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [googleData, setGoogleData] = useState();

  const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';
  const {signUpViaGoogle, setIsSignedIn} = useAuth();

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
      const email = user.email;
      const signInMethods = await auth().fetchSignInMethodsForEmail(email);

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      if (signInMethods.length) {
        const userCredential = await auth().signInWithCredential(
          googleCredential,
        );
        setIsSignedIn(true);
        await updateFcmToken(userCredential.user.uid);
      } else {
        signUpViaGoogle();
        const userCredential = await auth().signInWithCredential(
          googleCredential,
        );

        setGoogleData({
          idToken: idToken,
          googleId: user.id, // or user.uid based on the API
          email: user.email,
          firebase_uid: userCredential.user.uid,
        });
        setIsFirstTimeUser(true);
      }
    } catch (error) {
      console.error('Error in Google Sign In:', error);
    }
  };

  const onDirectSignUpPress = () => {
    setIsFirstTimeUser(true);
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
      setIsFirstTimeUser(false);
      setMessage('');
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
          googleData={googleData}
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
    position: 'relative',
    bottom: 100,
    color: 'white',
  },
});

export default LoginPage;

//173733886535-jvvko61hq82j9euu278a61df1hhig9vu.apps.googleusercontent.com
