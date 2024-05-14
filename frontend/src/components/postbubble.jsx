import React, {useState, useRef} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Importing Icon component
import Svg, {Path} from 'react-native-svg';
import auth from '@react-native-firebase/auth';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {useFeedContext} from '../FeedContext'; // Adjust the import path as necessary
import axios from 'axios';
import {Animated} from 'react-native';

const formatTimestamp = isoTimestamp => {
  const postDate = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now - postDate; // milliseconds difference
  const diffMins = Math.round(diffMs / 60000); // minutes difference
  const diffHours = Math.round(diffMs / 3600000); // hours difference
  const diffDays = Math.round(diffMs / 86400000); // days difference

  if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    // Format the date as "Feb 8"
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const date = postDate.getDate();
    const monthIndex = postDate.getMonth();
    const year = postDate.getFullYear();
    const currentYear = now.getFullYear();

    // Use substring to get the last two digits of the year
    const yearShortForm = year.toString().substring(2);

    // If the post was made in a different year, include the year in the format.
    if (year < currentYear) {
      return `${monthNames[monthIndex]} ${date}, '${yearShortForm}`;
    }
    return `${monthNames[monthIndex]} ${date}`;
  }
};

const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';
const userId = auth().currentUser ? auth().currentUser.uid : null;
console.log(userId);
const PostBubble = ({
  postId,
  post_userId,
  displayname,
  username,
  text,
  timestamp,
  likes: initialLikes,
  isLiked: initialIsLiked, // Pass isLiked status to PostBubble
  userLogo,
  repost,
  repostedDisplayname,
  repostedUsername,
  repostedUserLogo,
  repostedTimestamp,
  repostedUserId,
  navigation,
}) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const {setSwipedPost} = useFeedContext(); // Use context to get setSwipedPost
  const swipeableRef = useRef(null);

  const renderLeftActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.rightAction}
        onPress={() => {
          // Custom logic to reset swipe or handle reply action
          swipeableRef.current.reset(); // Assuming you want to manually close
        }}>
        <Animated.View style={{transform: [{scale}]}}>
          <Icon name="reply" size={30} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const handleSwipeRight = () => {
    setSwipedPost({postId, displayname, text, post_userId});
    swipeableRef.current?.reset();
    // Additional logic to reset position if necessary
  };

  const toggleLike = async () => {
    // Optimistically update UI
    const updatedIsLiked = !isLiked;
    const newLikes = updatedIsLiked ? likes + 1 : likes - 1; // Adjust likes based on new like status
    setIsLiked(updatedIsLiked);

    setIsLiked(!isLiked);
    setLikes(newLikes);

    try {
      // Construct the URL with postId and userId
      const toggleLikeUrl = `${apiUrl}/toggle_like/${postId}/${userId}`;

      // Send like toggle to backend
      await axios.post(toggleLikeUrl); // No need to send body as postId and userId are in the URL
      // If successful, nothing to do since UI was already updated
    } catch (error) {
      // On failure, revert UI changes
      setIsLiked(isLiked);
      setLikes(likes);
      console.error('Failed to toggle like', error);
    }
  };

  const navigateToProfile = (userId, repost) => {
    navigation.navigate('ProfileScreen', {
      userId: userId,
      profilePic: repost ? repostedUserLogo : userLogo, // Adjust keys as per your API response
      display_name: repost ? repostedDisplayname : displayname,
      username: repost ? repostedUsername : username,
    });
  };
  // Handle the case where user details are not found

  const heartIconPath =
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'; // Path for a heart icon

  return (
    <View style={styles.container}>
      {/* Show ogContainer if repost is true */}
      {repost && (
        <View style={styles.ogContainer}>
          <TouchableOpacity
            onPress={() => navigateToProfile(post_userId, repost)}
            style={styles.repostTouchable}>
            <Image source={{uri: userLogo}} style={styles.logo} />
            <Text style={styles.displayname}>
              {displayname + ' swiped from their chat'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.repostContainer}>
        {/* Conditionally use repostedUserLogo or userLogo based on repost status */}
        <TouchableOpacity
          onPress={() =>
            navigateToProfile(repost ? repostedUserId : post_userId, repost)
          }>
          <Image
            source={repost ? {uri: repostedUserLogo} : {uri: userLogo}}
            style={styles.repostLogo}
          />
        </TouchableOpacity>
        <Swipeable
          ref={swipeableRef}
          renderLeftActions={renderLeftActions}
          onSwipeableOpen={direction => {
            if (direction === 'left') {
              handleSwipeRight(postId, displayname, text);
            }
          }}
          friction={1}>
          <View style={styles.bubble}>
            {/* Conditionally use repostedDisplayname or displayname based on repost status */}
            <TouchableOpacity
              onPress={() =>
                navigateToProfile(repost ? repostedUserId : post_userId, repost)
              }>
              <Text style={styles.repostedDisplayname}>
                {repost ? repostedDisplayname : displayname}
              </Text>
            </TouchableOpacity>

            <Text style={styles.text}>{text}</Text>
            {/* Conditionally use repostedTimestamp or timestamp based on repost status */}
            <Text style={styles.timestampInsideBubble}>
              {formatTimestamp(repost ? repostedTimestamp.toDate() : timestamp)}
            </Text>
          </View>
        </Swipeable>

        <View style={styles.footer}>
          <TouchableOpacity onPress={toggleLike} style={styles.iconContainer}>
            <Svg height="20" width="20" viewBox="0 0 24 24">
              <Path
                d={heartIconPath}
                fill={isLiked ? '#C7ADD0' : '#202020'}
                stroke="white"
                strokeWidth="2"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.likeText}>{likes}</Text>
          {/* Always use the original timestamp in the footer */}
          <Text style={styles.timestamp}>
            {'posted at ' + formatTimestamp(timestamp)}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
};
const styles = StyleSheet.create({
  ogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    left: 60, // Adjust as necessary
    marginBottom: 3, // Space between repost header and original post
  },
  logo: {
    width: 20, // Smaller than the original logo
    height: 20,
    borderRadius: 10,
  },
  displayname: {
    marginLeft: 5,
    fontSize: 14, // Smaller font size than the original username
    color: 'white', // Adjust color as necessary
  },
  repostTouchable: {
    flexDirection: 'row', // Make sure that the touchable area is also in a row
    alignItems: 'center', // Align items in the center
  },

  container: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginLeft: 10,
    marginTop: 20,
  },
  repostLogo: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignSelf: 'flex-start', // Aligns logo to the start of the bubbleContainer
    marginBottom: -25, // Adjust based on your layout needs
    marginLeft: -40,
    zIndex: 1, // Ensure the logo is above the bubble
  },
  repostContainer: {
    flexDirection: 'column',
    marginLeft: 60,
    paddingTop: 7, // Adjust if necessary
  },
  bubble: {
    backgroundColor: '#3C3C3C',
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    maxWidth: '70%',
    padding: 10,
  },
  repostedDisplayname: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'white',
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  timestampInsideBubble: {
    color: 'white',
    fontSize: 10,
    marginTop: 5,
    left: 160,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 5,
    left: 230,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  likeIcon: {
    fontSize: 16,
    color: 'red',
  },
  likeText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 5, // Adjusted for visibility
  },
  timestamp: {
    color: 'white',
    fontSize: 10,
    right: 250,
  },
  divider: {
    borderBottomColor: '#CCC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '35%',
    marginTop: 10,
    left: 110,
  },
  iconContainer: {},
});

export default PostBubble;

//     color: '#c599f8', // Changed color for visibility
