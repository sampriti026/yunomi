// import React, {useState, useEffect} from 'react';
// import ChatsList from './ChatsList';
// import Chats from './Chats';
// import {GoogleSignin} from '@react-native-google-signin/google-signin';

// function ParentComponent() {
//   const [userId, setUserId] = useState(null);

//   useEffect(() => {
//     const fetchUserId = async () => {
//       try {
//         const userInfo = await GoogleSignin.signInSilently();
//         setUserId(userInfo.user.id);
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     fetchUserId();
//   }, []);

//   return (
//     <>
//       <ChatsList userId={userId} />
//       <Chats userId={userId} />
//     </>
//   );
// }

// export default ParentComponent;
