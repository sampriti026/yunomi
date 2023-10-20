import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';

const formatTimestamp = isoTimestamp => {
  const date = new Date(isoTimestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

  // If you want 24-hour format
  // return `${hours}:${formattedMinutes}`;

  // For 12-hour format like "11:53 PM"
  const amOrPm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours; // Convert 24-hour to 12-hour format

  return `${formattedHours}:${formattedMinutes} ${amOrPm}`;
};

const RightPostBubble = ({text, timestamp, username, profilePic}) => (
  <View style={styles.rightContainer}>
    <Image style={styles.profilePic} source={{uri: profilePic}} />
    <View>
      <Text style={styles.username}>{username}</Text>
      <View style={styles.rightBubble}>
        <Text style={styles.rightText}>{text}</Text>
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
        </View>
      </View>
    </View>
  </View>
);

const LeftPostBubble = ({text, timestamp, username}) => (
  <View style={styles.leftContainer}>
    {/* <Image style={styles.profilePic} source={{uri: profilePic}} /> */}
    <View>
      <Text style={styles.username}>{username}</Text>
      <View style={styles.leftBubble}>
        <Text style={styles.leftText}>{text}</Text>
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 5,
    marginRight: 10,
  },
  leftContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 5,
    marginLeft: 10,
  },
  rightBubble: {
    backgroundColor: '#2c414e', // Some blue color for the sender
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    maxWidth: '70%',
    padding: 10,
  },
  leftBubble: {
    backgroundColor: '#383838', // Some gray color for the receiver
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    maxWidth: '70%',
    padding: 10,
  },
  rightText: {
    color: 'white',
  },
  leftText: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  timestamp: {
    color: 'white',
    fontSize: 10,
    marginRight: 5,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  optionButton: {
    backgroundColor: '#6c6c6c', // choose a color that fits your design
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  optionButtonText: {
    color: 'white',
    fontSize: 12,
  },
  username: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },

  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
});

export {RightPostBubble, LeftPostBubble};
