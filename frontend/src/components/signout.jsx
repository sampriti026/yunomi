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
