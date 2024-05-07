import {useState, useEffect} from 'react';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useCurrentUser = () => {
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      // First, try to get the user ID from Firebase Auth
      const user = auth().currentUser;
      if (user) {
        setLoggedInUserId(user.uid);
      } else {
        // If no user is logged in, check for a stored token
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          // Attempt to re-authenticate using the stored token
          reAuthenticate(token);
        }
      }
    };

    checkUser();
  }, []);

  const reAuthenticate = async token => {
    // Example: Use token to re-authenticate (this is pseudo-code)
    try {
      const credential = auth.EmailAuthProvider.credential(null, token);
      await auth().signInWithCredential(credential);
      // If successful, set the user ID
      if (auth().currentUser) {
        setLoggedInUserId(auth().currentUser.uid);
      }
    } catch (error) {
      console.error('Re-authentication failed:', error);
      // Handle failure, such as redirecting to a login screen
    }
  };

  return loggedInUserId;
};

export default useCurrentUser;
