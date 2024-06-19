##  React Native App: Authentication, Chat, and Notifications 💬📱

**Table of Contents** 

1. **Overview**
   - Purpose of the App
   - Key Features
2. **Authentication**
   - Authentication Provider
   - User Sign-In/Sign-Up
   - Firebase Authentication Integration
3. **Navigation**
   - React Navigation Stack Navigator
   - Navigation Routes and Components
4. **Chat Functionality**
   - Chat Screen
   - Sending and Receiving Messages
   - Private and Public Conversations
5. **Notifications**
   - Firebase Cloud Messaging (FCM) Setup
   - Notification Handling (Foreground and Background)
   - Custom Navigation based on Notification Data
6. **In-App Purchases**
   - React Native IAP Library
   - Purchase Initialization and Error Handling
7. **Additional Features**
   - Profile Screen
   - User Details Fetching
8. **Code Structure**
   - File Breakdown
   - Component Hierarchy
9. **Dependencies**
   - External Libraries

***

## 1. Overview 

This React Native application provides a platform for users to interact through chat, manage their profiles, and receive notifications. The app leverages Firebase Authentication for secure user management and Firebase Cloud Messaging (FCM) for real-time notification delivery.

### 1.1 Key Features:

* **User Authentication:** Sign-in/Sign-up with Firebase Authentication.
* **Chat Functionality:**  Send and receive messages in private and public conversations.
* **Notifications:** Receive push notifications for new messages, likes, and other interactions.
* **Profile Management:** View and update user profiles.
* **In-App Purchases:** Integrate in-app purchases using the React Native IAP library.

## 2. Authentication

### 2.1 Authentication Provider:

The app utilizes a custom authentication provider (`AuthProvider`) that wraps the application's core logic, handling user authentication state. 

### 2.2 User Sign-In/Sign-Up:

- Users can sign in/sign up using Firebase Authentication. 
- The `isSignedIn` state variable tracks the user's logged-in status.
- The `isSignUpViaGoogle` state variable indicates if the user signed up using Google.

### 2.3 Firebase Authentication Integration:

- The `auth` module from `@react-native-firebase/auth` is used to handle user authentication. 
- The `onAuthStateChanged` listener checks for changes in the user's authentication state.
- Upon user authentication, the app sets the `isSignedIn` state variable accordingly. 

## 3. Navigation

### 3.1 React Navigation Stack Navigator:

- The `createStackNavigator` from `@react-navigation/stack` is used to manage the navigation flow between different screens.
- The app uses a single stack navigator (`AppStack`) for managing the navigation.

### 3.2 Navigation Routes and Components:

- **`Login`:** The login screen for users to sign in or sign up.
- **`FrameTabsScreen`:** The main screen after successful login, typically containing tabs for different app sections.
- **`ChatScreen`:** The chat screen for users to communicate with others.
- **`ProfileScreen`:** The screen for viewing and managing user profiles.

## 4. Chat Functionality

### 4.1 Chat Screen:

- The `ChatScreen` component handles the display and interaction of chat conversations.
- The screen displays messages, input fields for sending new messages, and possibly user profile information.

### 4.2 Sending and Receiving Messages:

- The app will likely use a real-time database or messaging service (e.g., Firebase Realtime Database, Firestore, or a dedicated chat SDK) to enable real-time message sending and reception. 

### 4.3 Private and Public Conversations:

- The app supports both private (one-on-one) and public (group) conversations.
- The `isPrivate` flag is used to differentiate between conversation types.

## 5. Notifications

### 5.1 Firebase Cloud Messaging (FCM) Setup:

- The app integrates with Firebase Cloud Messaging (FCM) for push notification delivery.
- FCM is configured to handle notification requests, token generation, and background message handling.

### 5.2 Notification Handling (Foreground and Background):

- The app uses `messaging()` from `@react-native-firebase/messaging` to handle both foreground and background notifications.
- The `requestPermission()` function is used to request user permission to send notifications.
- `getInitialNotification()` is used to retrieve any initial notifications received while the app was closed.
- `setBackgroundMessageHandler()` is used to handle notifications received when the app is in the background.

### 5.3 Custom Navigation based on Notification Data:

- The app analyzes the data associated with incoming notifications to determine the appropriate screen to navigate to.
- For example, a new message notification would navigate to the `ChatScreen`, while a profile update notification might navigate to the `ProfileScreen`.

## 6. In-App Purchases

### 6.1 React Native IAP Library:

- The `react-native-iap` library is used to handle in-app purchases.

### 6.2 Purchase Initialization and Error Handling:

- The `initConnection()` function initializes the IAP connection.
- The `flushFailedPurchasesCachedAsPendingAndroid()` function is used to clear any pending purchase requests.
- Error handling is implemented to catch potential issues during initialization.

## 7. Additional Features

### 7.1 Profile Screen:

- The `ProfileScreen` allows users to view and update their profiles.
- It typically displays user information (name, username, profile picture, etc.) and provides options for editing these details.

### 7.2 User Details Fetching:

- The `fetchUserDetails` function is used to retrieve user details from a data source (e.g., Firebase database).
- The fetched details are used to populate the user's profile information.

## 8. Code Structure

### 8.1 File Breakdown:

- `App.js`: Main application component, responsible for authentication, navigation, and overall app logic.
- `LoginPage.js`: Login screen component for user authentication.
- `ChatScreen.js`: Chat screen component for displaying and managing chat conversations.
- `ProfileScreen.js`: Profile screen component for user profile management.
- `StackNavigator.js`: Component responsible for defining the navigation stack for logged-in users. 
- `authcontext.js`: Authentication context provider for managing user authentication state.
- `services.jsx/fetchUser.js`: Function for retrieving user details.
- `services.jsx/notification.js`: Function for setting up foreground notification handling.

### 8.2 Component Hierarchy:

```
AppWrapper 
  └ GestureHandlerRootView
    └ AuthProvider
      └ MenuProvider
        └ App
          └ NavigationContainer
            └ NotificationHandler
              └ AppStack.Navigator
                └ AppStack.Screen (Login)
                └ AppStack.Screen (FrameTabsScreen)
                  └ StackNavigator
                    └ TabNavigator (tabs for different sections)
                └ AppStack.Screen (ChatScreen)
                └ AppStack.Screen (ProfileScreen)
```

## 9. Dependencies

- `react`: Core React library for building user interfaces.
- `react-native`: Library for building mobile applications with React.
- `@react-native-firebase/auth`: Firebase Authentication library.
- `@react-navigation/native`: Library for managing app navigation.
- `@react-navigation/stack`: Library for implementing a stack-based navigation structure.
- `react-native-screens`: Library for optimizing screen rendering.
- `react-native-gesture-handler`: Library for handling touch gestures.
- `react-native-popup-menu`: Library for creating popup menus.
- `@react-native-firebase/messaging`: Firebase Cloud Messaging library.
- `react-native-iap`: Library for handling in-app purchases.
- `react-native-get-random-values`: Library for generating random values.
- `react-native-push-notification`: Library for displaying local push notifications. 
