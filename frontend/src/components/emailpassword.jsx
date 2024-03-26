import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import {updateFcmToken} from './updatefcm';
import {BackHandler} from 'react-native';

const EmailPasswordLoginForm = ({setMessage, navigation, apiUrl}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLoginButtonPress = async () => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      console.log('Logged in with:', userCredential.user.email);
      const firebaseUid = userCredential.user.uid; // Fetching the Firebase UID
      await updateFcmToken(firebaseUid, apiUrl); // Update FCM Token for the user

      // Optionally reset form fields here
      setEmail('');
      setPassword('');
      // Navigate or update UI
      navigation.navigate('FrameTabsScreen');
    } catch (error) {
      console.error(error);
      setMessage('Login failed: ' + error.message);
    }
  };

  const onForgotPasswordPress = () => {
    if (email.trim() === '') {
      setMessage('Please enter your email address first.');
      return;
    }

    auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        // Password reset email sent!
        setMessage('Please check your email to reset your password.');
      })
      .catch(error => {
        // If an error occurred, display it to the user
        console.error(error);
        setMessage(
          'Failed to send password reset email. Please try again later.',
        );
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry={true}
      />
      <TouchableOpacity style={styles.button} onPress={onLoginButtonPress}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onForgotPasswordPress}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    padding: 15,
    marginBottom: 10,
    width: '80%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray', // Customize as needed
  },
  button: {
    backgroundColor: '#7552A0', // Adjust color as needed
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    margin: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#007bff', // Use any color that suits your app's theme
    marginTop: 15,
  },
});

export default EmailPasswordLoginForm;
