import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, Image, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import ChatsList from '../components/chatlist';

function Chats({navigation}) {
  const [userId, setUserId] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userInfo = await GoogleSignin.signInSilently();
        setUserId(userInfo.user.id);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    console.log('UserId passed to chats:', userId);

    if (userId) {
      const unsubscribe = firestore()
        .collection('chats')
        .where('participants', 'array-contains', userId)
        .onSnapshot(querySnapshot => {
          const chatData = [];
          querySnapshot.forEach(documentSnapshot => {
            chatData.push({
              ...documentSnapshot.data(),
              id: documentSnapshot.id,
            });
          });
          setChats(chatData);
        });

      return () => unsubscribe();
    }
  }, [userId]);

  return (
    <View>
      {/* Pass the userId as a prop to the ChatList component */}
      <ChatsList userId={userId} />
      <FlatList
        data={chats}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ChatScreen', {chatId: item.id})}
            style={{flexDirection: 'row', padding: 10, alignItems: 'center'}}>
            <Image
              source={{uri: item.profileImage}}
              style={{width: 50, height: 50, borderRadius: 25, marginRight: 10}}
            />
            <Text>{item.lastMessage}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

export default Chats;
