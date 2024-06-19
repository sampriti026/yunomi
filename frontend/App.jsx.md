# App.js - Application Entry Point 

## Table of Contents 

* [Import Statements](#import-statements)
* [App Component](#app-component)
* [AppWrapper Component](#appwrapper-component)
* [Explanation of the Code](#explanation-of-the-code)


## Import Statements 

| Import | Description |
|---|---|
| `React, {useState, useEffect}` |  Core React components for state management and lifecycle methods. |
| `LoginPage` | Login screen component. |
| `auth` | Firebase Authentication library for managing user authentication. |
| `NavigationContainer` |  React Navigation component for managing navigation between screens. | 
| `createStackNavigator` | React Navigation component for creating a stack-based navigation structure. |
| `enableScreens` |  React Native Screens library for optimizing screen transitions. |
| `ChatScreen` |  Chat screen component. |
| `ProfileScreen` | Profile screen component. |
| `GestureHandlerRootView` | React Native Gesture Handler component for handling gestures. |
| `MenuProvider` | React Native Popup Menu component for providing a menu context. |
| `messaging` | Firebase Messaging library for handling push notifications. |
| `setupForegroundMessageHandler` | Function for handling push notifications in the foreground. |
| `RNIap` | React Native In-App Purchase library for managing in-app purchases. |
| `'react-native-get-random-values'` | Library for generating random numbers. |
| `useNavigation` | React Navigation hook for accessing the navigation object. |
| `PushNotification` | React Native Push Notification library for managing push notifications. |
| `StackNavigator` | Stack navigator component for navigating between screens. |
| `AuthProvider, useAuth` |  Components for managing authentication context. |
| `fetchUserDetails` | Function for fetching user details. | 

## App Component

```javascript
function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [fetchedUserDetails, setFetchedUserDetails] = useState(null);

  const {isSignedIn, setIsSignedIn, isSignUpViaGoogle} = useAuth();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        if (!isSignUpViaGoogle) {
          setIsSignedIn(true);
        } // No action is taken when isSignUpViaGoogle is true
      } else {
        setIsSignedIn(false); // Explicitly set isSignedIn to false when no user is logged in
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, [isSignUpViaGoogle]); // Removed setIsSignedIn from the dependency array

  // ... rest of the App component code ...

}
```

**Description:**

* The `App` component is the main entry point of the application. 
* It manages the application's state, including the user's authentication status and fetched user details.
* The component uses the `useAuth` hook to access the authentication context, including the `isSignedIn`, `setIsSignedIn`, and `isSignUpViaGoogle` values.
* It uses `useEffect` to listen for changes in the authentication state and update the state accordingly. 
* The component also handles the initialization of the Firebase Messaging and React Native In-App Purchase libraries. 

## AppWrapper Component

```javascript
const AppWrapper = () => (
  <GestureHandlerRootView style={{flex: 1}}>
    <AuthProvider>
      <MenuProvider>
        <App />
      </MenuProvider>
    </AuthProvider>
  </GestureHandlerRootView>
);

export default AppWrapper;
```

**Description:**

* The `AppWrapper` component is the top-level component of the application, wrapping the `App` component and providing context.
* It uses the `GestureHandlerRootView` component to enable gesture handling for the application.
* It provides the `AuthProvider` component to manage the authentication context.
* It provides the `MenuProvider` component to enable the use of the popup menu functionality.

## Explanation of the Code

### Authentication Management 

* The code utilizes Firebase Authentication to handle user authentication.  
* The `onAuthStateChanged` listener in the first `useEffect` hook tracks changes in the user's authentication status. 
* It updates the `isSignedIn` state variable based on whether a user is signed in or not. 
* This mechanism ensures that the app correctly displays the appropriate screens (login screen or main screens) based on the user's authentication status. 

### Push Notification Management 

* The `useEffect` hook that calls `initMessaging` handles the request for notification permissions. 
* If the user grants permission, the app retrieves the device's Firebase Cloud Messaging (FCM) token, which is used to send notifications to the device. 
* The code utilizes the `messaging().setBackgroundMessageHandler` method to handle push notifications even when the app is in the background.
* The `NotificationHandler` component uses the `PushNotification` library to handle received notifications and navigate to appropriate screens based on the notification's content. 
* The component also handles initial notifications received when the app is launched.  

### In-App Purchase Management 

* The `useEffect` hook that calls `initIAP` handles the initialization of React Native In-App Purchase. 
* It flushes any cached pending purchases and fetches the user's details after the initialization is complete. 

### Navigation Management 

* The code utilizes React Navigation to manage navigation between different screens. 
* The `createStackNavigator` function creates a stack navigator, which allows the app to push and pop screens onto a stack. 
* The `App` component renders different screens based on the user's authentication status using conditional rendering. 

### Overall Structure 

* The code follows a functional component-based structure, where each component is responsible for a specific part of the application. 
* The code utilizes hooks to manage state, lifecycle events, and navigation. 
* The `AppWrapper` component provides context for the entire application, while the `App` component handles core logic and navigation. 
* The code leverages Firebase services for authentication and messaging, as well as React Native libraries for navigation, gestures, and in-app purchases. 
* The code includes well-placed comments to explain the purpose of different code blocks and functions. 
