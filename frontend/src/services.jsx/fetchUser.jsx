import firestore from '@react-native-firebase/firestore';

const fetchUserDetails = async participantId => {
  // Placeholder function to fetch user details from Firestore
  const userDoc = await firestore()
    .collection('users')
    .doc(participantId)
    .get();
  if (userDoc.exists) {
    return {userId: participantId, ...userDoc.data()}; // Include additional user details as needed
  }
  return null;
};

export default fetchUserDetails;
