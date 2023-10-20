import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  PanResponder,
} from 'react-native';
import axios from 'axios';
import firestore from '@react-native-firebase/firestore';
import {ListItem, Icon} from 'react-native-elements';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import {RightPostBubble, LeftPostBubble} from '../components/postbubbles'; // Import from your bubble components file
import InputBox from '../components/inputbox'; // Import from your InputBox component file
import auth from '@react-native-firebase/auth';

const BASE_URL = 'http://10.0.2.2:8000';

const PostItem = ({item, onLike, onReply}) => (
  <PanGestureHandler
    onHandlerStateChange={event => {
      if (event.nativeEvent.state === State.END) {
        if (event.nativeEvent.translationX > 100) {
          onReply(item);
        }
      }
    }}>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <View style={{flex: 1}}>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Subtitle>{`Posted by: ${item.display_name}`}</ListItem.Subtitle>
            <ListItem.Title>{item.content}</ListItem.Title>
            <ListItem.Subtitle>{`Posted at: ${new Date(
              item.timestamp.toDate(),
            ).toLocaleString()}`}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      </View>
      <TouchableOpacity onPress={() => onLike(item.id, item.likes)}>
        <Icon name="heart" type="font-awesome" color="#f50" />
        <Text>{item.likes}</Text>
      </TouchableOpacity>
    </View>
  </PanGestureHandler>
);

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyTo, setReplyTo] = useState(null); // To keep track of the post the user is replying to

  // useEffect(() => {
  //   const unsubscribe = firestore()
  //     .collection('posts')
  //     .orderBy('timestamp', 'desc')
  //     .onSnapshot(querySnapshot => {
  //       const postsData = querySnapshot.docs.map(doc => {
  //         return {id: doc.id, ...doc.data()};
  //       });
  //       setPosts(postsData);
  //     });

  //   return () => unsubscribe();
  // }, []);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const usersCollection = await firestore().collection('users').get();
        console.log(
          'All Users:',
          usersCollection.docs.map(doc => doc.id),
        ); // Log document IDs

        const response = await axios.get(`${BASE_URL}/get_posts`); // Assuming you have a get_posts endpoint in backend
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    }
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderEnd: (_, gestureState) => {
      if (gestureState.dx > 50) {
        // User swiped to the right, you can implement your reply functionality here.
        // For demonstration, let's set replyTo to the last message
        setReplyTo(posts[posts.length - 1].text);
      }
    },
  });

  const addNewPost = async content => {
    try {
      const user = auth().currentUser;
      const userId = user.uid;
      console.log(userId);
      const userDoc = await firestore().collection('users').doc(userId).get();
      console.log('User Document:', userDoc);

      if (userDoc.exists) {
        const postDetails = {
          user_id: userId,
          content: 'hello',
          display_name: 'sampriti',
          // profile_pic_uri: userDoc.data().Profilepicurl,
        };

        const response = await fetch(`${BASE_URL}/send_post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postDetails),
        });

        const result = await response.json();

        if (result.status === 'success') {
          console.log('Post added successfully');
        } else {
          console.error('Error adding post:', result.message);
        }
      } else {
        console.error('User data not found');
      }
    } catch (error) {
      console.error('Error while adding a post:', error.message);
    }
  };

  const likePost = async (postId, currentLikes) => {
    await firestore()
      .collection('posts')
      .doc(postId)
      .update({
        likes: currentLikes + 1,
      });
  };

  const slideToReply = post => {
    Alert.alert('Reply', `Replying to post: ${post.content}`);
  };

  const renderItem = ({item}) => {
    return (
      <View {...panResponder.panHandlers}>
        {item.isByUser ? (
          <RightPostBubble
            text={item.text}
            timestamp={item.timestamp}
            username={item.username}
          />
        ) : (
          <LeftPostBubble
            text={item.text}
            timestamp={item.timestamp}
            username={item.username}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
      <InputBox sendMessage={addNewPost} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // dark background
  },
});
export default PostFeed;
