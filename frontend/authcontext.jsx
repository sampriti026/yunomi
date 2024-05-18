// AuthContext.js
import React, {createContext, useState, useContext} from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({children}) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSignUpViaGoogle, setIsSignUpViaGoogle] = useState(false);

  const signIn = user => {
    setIsSignedIn(true);
  };

  const signUpViaGoogle = () => {
    setIsSignUpViaGoogle(true);
  };

  const completeGoogleSignUp = () => {
    setIsSignedIn(true);
    setIsSignUpViaGoogle(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        setIsSignedIn,
        signIn,
        signUpViaGoogle,
        completeGoogleSignUp,
        isSignUpViaGoogle,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
