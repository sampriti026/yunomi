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
import {useAuth} from '../../authcontext';

// Individual step component

// Main multi-step form component
const MultiStepForm = ({setMessage, navigation, apiUrl, googleData}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    ...(isSignUpViaGoogle ? {} : {email: ''}),
    password: '',
  });
  const [formError, setFormError] = useState('');

  const [usernameError, setUsernameError] = useState(''); // New state for username error
  const {isSignUpViaGoogle, setIsSignUpViaGoogle, setIsSignedIn} = useAuth(); // Access the state from Context

  useEffect(() => {
    if (isSignUpViaGoogle) {
      setFormData(prevFormData => ({
        ...prevFormData,
        google_user_id: googleData.googleId,
        email: googleData.email,
        firebase_uid: googleData.firebase_uid,
      }));
    }
    setMessage('');
  }, [googleData, isSignUpViaGoogle]);

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

  const checkEmailExists = async email => {
    try {
      const existingUser = await auth().fetchSignInMethodsForEmail(email);
      if (existingUser.length > 0) {
        setFormError(
          'An account already exists with this email. Please log in instead.',
        );
        return false;
      }
      return true;
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        setFormError("This email address doesn't seem right, check again.");
      }
      console.error('Error checking email: ', error);
      return false;
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
  const steps = [];

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

  // Common steps for all users
  steps.push({
    component: (
      <TextInput
        placeholder="Name"
        value={formData.display_name}
        onChangeText={text => updateField('display_name', text)}
        style={styles.input}
      />
    ),
    key: 'display_name',
  });
  steps.push({
    component: (
      <TextInput
        placeholder="Username"
        value={formData.username}
        onChangeText={text => updateField('username', text)}
        style={styles.input}
      />
    ),
    key: 'username',
  });

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
        const response = await axios.post(`${apiUrl}/create_user/`, formData);
        if (response.status === 200) {
          await updateFcmToken(formData.firebaseUid, apiUrl);
          setIsSignedIn(true); // Set signed in true after API success
        }
      }
    } catch (error) {
      // Handle both axios errors and potential 404 from username check
      if (error.response) {
        const errorMessage =
          error.response.status === 404
            ? 'Username is available, but other error occurred.'
            : 'Error during user creation: ' +
              (error.response.data || error.message);
      } else {
        setFormError('Network error or other issue: ' + error.message);
      }
      console.error(error);
    }
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) return; // Validate current input first

    // If current step is the email step in non-Google signup, check the email
    if (
      !isSignUpViaGoogle &&
      currentStep === steps.findIndex(step => step.key === 'email')
    ) {
      const emailIsValid = await checkEmailExists(formData.email);
      if (!emailIsValid) {
        return; // Stop progressing if the email is invalid
      }
    }

    // Proceed to next step if all checks are passed
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitDetails(); // Final step, attempt to submit the form data
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
    top: 70,
  },
});

export default MultiStepForm;
