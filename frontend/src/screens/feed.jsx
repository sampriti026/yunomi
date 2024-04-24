import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the Icon component
import InputBox from '../components/inputbox'; // Import from your InputBox component file
import auth from '@react-native-firebase/auth';
import PostBubble from '../components/postbubble';
import {FeedProvider, useFeedContext} from '../FeedContext';
import CheckBox from '@react-native-community/checkbox'; // Import CheckBox
import firestore from '@react-native-firebase/firestore';

const apiUrl = 'http://10.0.2.2:8000';

const Feed = ({navigation}) => {
  const [posts, setPosts] = useState([]);

  const {setSwipedPost, swipedPost} = useFeedContext(); // Use context to listen to swiped post details
  const [replyPrivately, setReplyPrivately] = useState(false);

  const userId = auth().currentUser ? auth().currentUser.uid : null;

  const fetchUserDetails = async userId => {
    // Placeholder function to fetch user details from Firestore
    const userDoc = await firestore().collection('users').doc(userId).get();
    if (userDoc.exists) {
      return {userId: userId, ...userDoc.data()}; // Include additional user details as needed
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('posts')
      .orderBy('timestamp', 'desc') // Ensure you have an index for this in Firestore
      .onSnapshot({
        error: e => console.error('Error fetching posts:', e),
        next: async querySnapshot => {
          const fetchedPosts = [];
          for (const doc of querySnapshot.docs) {
            const postData = doc.data();
            const userDetails = await fetchUserDetails(postData.user_id);

            if (postData.repost) {
              // Handling reposts
              const originalMessage = await firestore()
                .collection('conversations')
                .doc(postData.conversationId)
                .collection('messages')
                .doc(postData.messageId)
                .get();

              if (originalMessage.exists) {
                const originalData = originalMessage.data();
                const repostedUserDetails = await fetchUserDetails(
                  originalData.user_id,
                );

                fetchedPosts.push({
                  postId: doc.id,
                  post_userId: postData.user_id,
                  displayname: userDetails.display_name,
                  username: userDetails.username,
                  text: originalData.text,
                  timestamp: postData.timestamp,
                  likes: postData.likes,
                  liked_by: postData.liked_by,
                  userLogo: userDetails.profilePic,
                  repost: true,
                  repostedDisplayname: repostedUserDetails.display_name,
                  repostedUsername: repostedUserDetails.username,
                  repostedUserLogo: repostedUserDetails.profilePic,
                  repostedTimestamp: originalData.timestamp,
                  repostedUserId: originalData.user_id,
                });
              }
            } else {
              // Handling original posts
              fetchedPosts.push({
                postId: doc.id,
                post_userId: postData.user_id,
                displayname: userDetails.display_name,
                username: userDetails.username,
                text: postData.content,
                timestamp: postData.timestamp,
                likes: postData.likes,
                liked_by: postData.liked_by,
                userLogo: userDetails.profilePic,
                repost: false,
              });
            }
          }
          setPosts(fetchedPosts);
        },
      });

    return () => unsubscribe(); // Detach listener when the component is unmounted
  }, []);

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
    console.log(item.post_userId, item.repostedUserId, 'brr');
    return (
      <View>
        <PostBubble
          postId={item.postId}
          post_userId={item.post_userId}
          displayname={item.displayname}
          username={item.username}
          text={item.text}
          timestamp={item.timestamp}
          likes={item.likes}
          isLiked={item.isLiked}
          userLogo={item.userLogo}
          repost={item.repost}
          repostedDisplayname={item.repostedDisplayname}
          repostedUsername={item.repostedUsername}
          repostedUserLogo={item.repostedUserLogo}
          repostedTimestamp={item.repostedTimestamp}
          repostedUserId={item.repostedUserId}
          navigation={navigation}
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

const FeedWithProvider = ({navigation}) => (
  <FeedProvider>
    <Feed navigation={navigation} />
  </FeedProvider>
);

export default FeedWithProvider;
