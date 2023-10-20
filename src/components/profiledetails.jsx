// ProfileDetails.js
import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import photo from '../assets/photo.png';
import {Color, FontFamily, FontSize} from '../../globalstyles';
const ProfileDetails = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={photo} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={styles.displayName}>Display Name</Text>
          <Text style={styles.username}>@username</Text>
        </View>
      </View>
      <Text style={styles.bio}>
        Bio: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </Text>
      {/* Add other profile details here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#c599f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: {
    width: 56, // WhatsApp DP size
    height: 56, // WhatsApp DP size
    borderRadius: 28, // half of width/height for a perfect circle
    marginRight: 10, // space between image and text
  },
  textContainer: {
    flexDirection: 'column',
  },
  displayName: {
    fontSize: FontSize.size_xl,
    fontWeight: '700',
    fontFamily: FontFamily.latoBold,
    color: Color.fCDDEC,
    letterSpacing: 1,
  },
  username: {
    color: Color.fCDDEC,
  },
  bio: {
    color: Color.fCDDEC,
    marginTop: 5,
  },
});

export default ProfileDetails;