import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  Button,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the Icon component
import InputBox from '../components/inputbox'; // Import from your InputBox component file
import auth from '@react-native-firebase/auth';
import PostBubble from '../components/postbubble';
import {FeedProvider, useFeedContext} from '../FeedContext';
import CheckBox from '@react-native-community/checkbox'; // Import CheckBox

const apiUrl = 'http://10.0.2.2:8000';

const Feed = () => {
  const [posts, setPosts] = useState([]);

  const {setSwipedPost, swipedPost} = useFeedContext(); // Use context to listen to swiped post details
  const [replyPrivately, setReplyPrivately] = useState(false);

  const userId = auth().currentUser ? auth().currentUser.uid : null;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${apiUrl}/fetch_posts`);
      const postsWithLikeStatus = response.data.map(post => ({
        ...post,
        // Check if the current logged-in user's ID is directly in the `liked_by` array
        isLiked: post.liked_by.includes(userId),
      }));
      setPosts(postsWithLikeStatus);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to fetch posts');
    }
  };

  const renderReplyBox = () => {
    if (!swipedPost) return null; // No swiped post, no reply box

    return (
      <View style={styles.replyBox}>
        <View style={styles.replyContentAndCheckbox}>
          <View style={styles.replyContent}>
            <Text style={styles.replyDisplayName}>
              {swipedPost.displayname}
            </Text>
            <Text style={styles.replyText}>{swipedPost.text}</Text>
          </View>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={replyPrivately}
              onValueChange={setReplyPrivately}
              tintColors={{true: '#fff', false: '#fff'}} // Customize checkbox color
            />
            <Text style={styles.checkboxLabel}>Reply Privately</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setSwipedPost(null)}
          style={styles.crossButton}>
          <Icon name="times" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const addNewPost = async content => {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/send_post`, {
        user_id: userId,
        content: content,
        timestamp: new Date().toISOString(),
        repost: false,
        text: content, // Since this is for adding new posts, repost is false
      });

      const responseData = await response.data;
      if (responseData.status === 'success') {
        console.log('Post added successfully:', responseData.post_id);
        // Optionally refresh your post list here if needed
      } else {
        console.error('Failed to add post:', responseData.message);
      }
    } catch (error) {
      console.error('Error sending post:', error);
    }
  };

  const sendReply = async text => {
    if (!userId || !swipedPost) {
      console.error('User not authenticated or no post selected for reply');
      return;
    }

    // Assuming you fetch or have post_userId available somehow
    const type = replyPrivately ? 'private' : 'public';

    try {
      console.log(userId, swipedPost.postId, swipedPost.post_userId);
      const response = await axios.post(`${apiUrl}/post_reply`, {
        user_id: userId,
        post_id: swipedPost.postId,
        post_user_id: swipedPost.post_userId,
        text: text,
        type: type,
      });

      const responseData = await response.data;
      if (responseData.reply_id) {
        setSwipedPost(null); // Assuming you have a method to reset this context
        setReplyPrivately(false); // Reset to default state if applicable

        // Handle success (e.g., clear the input box, update UI)
      } else {
        console.error('Failed to post reply:', responseData.message);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const renderItem = ({item}) => {
    return (
      <View>
        <PostBubble
          postId={item.postId}
          post_userId={item.post_userId}
          displayname={item.displayname}
          text={item.text}
          timestamp={item.timestamp}
          likes={item.likes}
          isLiked={item.isLiked}
          userLogo={{uri: item.userLogo}}
          repost={item.repost}
          repostedDisplayname={item.repostedDisplayname}
          repostedUserLogo={{uri: item.repostedUserLogo}}
          repostedTimestamp={item.repostedTimestamp} // Use URI for network images
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.postId}
      />
      {swipedPost && renderReplyBox()}

      <InputBox sendMessage={swipedPost ? sendReply : addNewPost} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020', // dark background
  },
  replyBox: {
    flexDirection: 'row', // Keeps the main layout in a row
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#383838',
  },
  replyContentAndCheckbox: {
    flex: 1, // Allows this container to take up available space, excluding the cross button
    flexDirection: 'column', // Stacks children vertically
  },
  replyContent: {
    flexDirection: 'column', // Stack children vertically within the reply content
  },
  replyDisplayName: {
    color: '#fff',
    fontSize: 20,
    paddingLeft: 4,
  },
  replyText: {
    color: '#fff',
    padding: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Adds space between the text and the checkbox
  },
  checkboxLabel: {
    color: '#fff',
    marginLeft: 8,
  },
  crossButton: {},

  fetchPostsButton: {
    backgroundColor: '#4CAF50', // Green color for visibility
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },

  fetchPostsButtonText: {
    color: '#FFFFFF', // White text color
    fontSize: 16,
  },
});

const FeedWithProvider = () => (
  <FeedProvider>
    <Feed />
  </FeedProvider>
);

export default FeedWithProvider;
