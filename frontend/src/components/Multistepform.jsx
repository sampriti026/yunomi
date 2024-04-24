// MultiStepForm.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import {updateFcmToken} from './updatefcm';

// Individual step component

// Main multi-step form component
const MultiStepForm = ({
  setMessage,
  navigation,
  apiUrl,
  isSignUpViaGoogle,
  googleId,
  firebaseUid,
  email,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    ...(isSignUpViaGoogle ? {} : {email: ''}),
    password: '',
  });
  const [formError, setFormError] = useState('');

  const [usernameError, setUsernameError] = useState(''); // New state for username error

  useEffect(() => {
    if (isSignUpViaGoogle) {
      setFormData(prevFormData => ({
        ...prevFormData,
        google_user_id: googleId,
        firebase_uid: firebaseUid,
        email: email,
      }));
    }
  }, [googleId, firebaseUid, isSignUpViaGoogle]);

  const checkUsernameExists = async username => {
    if (!username.trim()) return; // Skip check if username is empty
    try {
      const response = await axios.get(`${apiUrl}/get_user/${username}/`);
      if (response.data) {
        setUsernameError('Username is already taken. Please choose another.');
      } else {
        setUsernameError(''); // Clear username error if check passes
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setUsernameError(''); // Clear username error if username does not exist
      } else {
        // Handle other errors, perhaps network issues or configuration errors
        console.error('Error checking username: ', error);
      }
    }
  };

  // Helper function to update form data
  const updateField = (field, value) => {
    setFormData(prevFormData => ({...prevFormData, [field]: value}));
    if (field === 'username') {
      checkUsernameExists(value); // Check username uniqueness when username field is updated
    }
    setFormError(''); // Clear form error message when user starts typing
  };

  const steps = [
    {
      component: (
        <TextInput
          placeholder="Name"
          value={formData.display_name}
          onChangeText={text => updateField('display_name', text)}
          style={styles.input}
        />
      ),
      key: 'display_name',
    },
    {
      component: (
        <TextInput
          placeholder="Username"
          value={formData.username}
          onChangeText={text => updateField('username', text)}
          style={styles.input}
        />
      ),
      key: 'username',
    },
  ];

  if (!isSignUpViaGoogle) {
    steps.push({
      component: (
        <TextInput
          placeholder="Email"
          value={formData.email}
          onChangeText={text => updateField('email', text)}
          keyboardType="email-address"
          style={styles.input}
        />
      ),
      key: 'email',
    });
    steps.push({
      component: (
        <TextInput
          placeholder="Password"
          value={formData.password}
          onChangeText={text => updateField('password', text)}
          secureTextEntry={true}
          style={styles.input}
        />
      ),
      key: 'password',
    });
  }

  const validateCurrentStep = () => {
    // Check if the current step's input is filled
    const currentInput = formData[steps[currentStep].key];
    if (currentInput === undefined || currentInput.trim() === '') {
      setFormError('Please enter the details.');
      return false;
    }
    return true;
  };

  const submitDetails = async () => {
    try {
      // If signing up directly (not via Google), you might still want to check username uniqueness as a final guard
      if (!isSignUpViaGoogle) {
        // Create Firebase Auth user with email and password

        const userCredential = await auth().createUserWithEmailAndPassword(
          formData.email,
          formData.password,
        );
        const firebaseUID = userCredential.user.uid;

        // Prepare formData for backend, excluding password for security
        const userData = {...formData, firebase_uid: firebaseUID};
        delete userData.password; // Ensure password isn't sent to your backend

        // Create user document in backend with Firebase UID

        await axios.post(`${apiUrl}/create_user/`, userData);
        await updateFcmToken(firebaseUID, apiUrl);
      } else {
        await axios.post(`${apiUrl}/create_user/`, formData);
        await updateFcmToken(firebaseUid, apiUrl);
      }
      setMessage('Welcome to the app!');

      navigation.navigate('FrameTabsScreen');
    } catch (error) {
      // Handle both axios errors and potential 404 from username check
      if (error.response) {
        const errorMessage =
          error.response.status === 404
            ? 'Username is available, but other error occurred.'
            : 'Error during user creation: ' +
              (error.response.data || error.message);
        setMessage(errorMessage);
      } else {
        setMessage('Network error or other issue: ' + error.message);
      }
      console.error(error);
    }
  };

  const nextStep = async () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await submitDetails(); // Final step, attempt to submit the form data
      }
    }
  };

  return (
    <View style={styles.container}>
      {steps[currentStep].component}
      {formError !== '' && <Text style={styles.errorText}>{formError}</Text>}
      {usernameError !== '' && (
        <Text style={styles.errorText}>{usernameError}</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={nextStep}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  button: {
    backgroundColor: '#7B50A5',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: 'white',
  },
});

export default MultiStepForm;
