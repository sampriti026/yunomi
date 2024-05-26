import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the Icon component
import InputBox from '../components/inputbox'; // Import from your InputBox component file
import auth from '@react-native-firebase/auth';
import PostBubble from '../components/postbubble';
import {FeedProvider, useFeedContext} from '../FeedContext';
import CheckBox from '@react-native-community/checkbox'; // Import CheckBox
import firestore from '@react-native-firebase/firestore';
import {encryptMessage} from '../services.jsx/encrypt';
import {findConversationId} from '../components/sendFirebaseMessage';

const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';

const Feed = ({navigation}) => {
  const [posts, setPosts] = useState([]);

  const {setSwipedPost, swipedPost} = useFeedContext(); // Use context to listen to swiped post details
  const [replyPrivately, setReplyPrivately] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);

  const loggedinUserId = auth().currentUser ? auth().currentUser.uid : null;

  const fetchUserDetails = async userId => {
    // Placeholder function to fetch user details from Firestore
    const userDoc = await firestore().collection('users').doc(userId).get();
    if (userDoc.exists) {
      return {userId: userId, ...userDoc.data()}; // Include additional user details as needed
    }
    return null;
  };

  const fetchPosts = async () => {
    if (loading || (lastVisible === null && posts.length > 0)) return;
    setLoading(true);
    try {
      const query = firestore()
        .collection('posts')
        .orderBy('timestamp', 'desc')
        .limit(10);

      const documentSnapshots = lastVisible
        ? query.startAfter(lastVisible)
        : query;

      const querySnapshot = await documentSnapshots.get();
      if (querySnapshot.empty) {
        console.log('No new posts to load.'); // Log or handle empty query snapshot
        setLastVisible(null); // Explicitly set lastVisible to null to prevent further fetching
        setLoading(false);
        return;
      }
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

      setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
      setLoading(false);

      if (querySnapshot.docs.length < 10) {
        setLastVisible(null); // No more data to fetch
      } else {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    } catch (e) {
      console.error('Error fetching posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(); // Fetch initial posts
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
          <Icon name="times" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const addNewPost = async content => {
    if (!loggedinUserId) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/send_post`, {
        user_id: loggedinUserId,
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
    if (!loggedinUserId || !swipedPost) {
      console.error('User not authenticated or no post selected for reply');
      return;
    }

    // Assuming you fetch or have post_userId available somehow
    const type = replyPrivately ? 'private' : 'public';
    const encryptedText = await encryptMessage(text);
    const conversation_id = await findConversationId(
      loggedinUserId,
      swipedPost.post_userId,
      replyPrivately,
    );

    try {
      console.log(conversation_id);
      const response = await axios.post(`${apiUrl}/post_reply`, {
        user_id: loggedinUserId,
        post_id: swipedPost.postId,
        post_user_id: swipedPost.post_userId,
        text: replyPrivately ? encryptedText : text,
        isPrivate: replyPrivately,
        conversation_id: conversation_id,
      });

      const responseData = await response.data;

      // Check if there's an error message inside the reply_id object
      if (responseData.reply_id && responseData.reply_id.status === 'error') {
        console.log('asdfasdfs');
        alert(
          'You have reached your limit of 3 private messages per week. Please consider upgrading to premium to continue messaging privately.',
        );
      } else if (responseData.status === 'error') {
        console.error('Failed to add post:', responseData.message);
        alert('There was an error posting your message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending post:', error);
    }
  };

  const renderItem = ({item}) => {
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
        onEndReached={fetchPosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator size="large" /> : null
        }
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
  crossButton: {
    size: 50,
  },

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
