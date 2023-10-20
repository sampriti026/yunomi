// ChatsList.js
import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, Image, StyleSheet, Button} from 'react-native';
import photo from '../assets/photo.png';

const ChatsList = ({userId}) => {
  const [chatsData, setChatsData] = useState([]);

  const API_URL = 'http://10.0.2.2:8000';

  useEffect(() => {
    console.log('UserId passed to ChatList:', userId);

    const fetchChats = async () => {
      try {
        const response = await fetch(
          `${API_URL}/get_latest_chats?user_id=${userId}`,
        );
        const data = await response.json();
        setChatsData(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (userId) {
      fetchChats();
    }
  }, [userId]);

  if (chatsData.length === 0) {
    return (
      <View style={styles.noChatsContainer}>
        <Text style={styles.noChatsText}>
          Person never chatted with anyone. Send a text?
        </Text>
        <Button
          title="Send a Text"
          onPress={() => {
            /* Handle send text action here */
          }}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={chatsData}
      keyExtractor={item => item.id}
      renderItem={({item}) => (
        <View style={styles.chatItem}>
          <Image source={photo} style={styles.dp} />
          <View style={styles.chatTextContainer}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName}>
                {item.name}{' '}
                <Text style={styles.chatUsername}>{item.username}</Text>
              </Text>
              <Text style={styles.chatDate}>{item.date}</Text>
            </View>
            <Text
              style={styles.chatLastMessage}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.lastMessage}
            </Text>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  dp: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  chatTextContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontWeight: 'bold',
  },
  chatDate: {
    color: 'grey',
  },
  chatUsername: {
    color: 'grey',
    fontWeight: 'normal',
  },
  chatLastMessage: {
    paddingTop: 7,
  },
});

export default ChatsList;
