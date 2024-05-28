// ProfileDetails.js
import React, {useState, useEffect} from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {Color, FontFamily, FontSize} from '../../globalstyles';
import Svg, {Path} from 'react-native-svg';
import firestore from '@react-native-firebase/firestore';
import fetchUserDetails from '../services.jsx/fetchUser';
import axios from 'axios';
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';

const ProfileDetails = ({
  userId,
  yourUserId,
  profileImage,
  displayName,
  username,
  isProfileLiked,
  setIsProfileLiked,
}) => {
  const [isLiked, setIsLiked] = useState(isProfileLiked);
  const [profilePic, setProfilePic] = useState(profileImage);

  useEffect(() => {
    // Update the state if the profilePic from params changes
    if (profileImage !== profilePic) {
      setProfilePic(profileImage);
    }
  }, [profileImage]);

  const apiUrl = 'https://yunomibackendlinux.azurewebsites.net';
  const pickImage = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      cropping: true,
      cropperCircleOverlay: true, // If you want a circular cropper
      compressImageQuality: 0.7,
    })
      .then(image => {
        const uri = image.path; // 'path' for cropped image
        setProfilePic(uri); // Update the local state to display the new image
        uploadImageToFirebase(uri); // Optionally save the new image URI to Firestore
      })
      .catch(error => {
        console.log('Error picking image: ', error);
      });
  };

  const uploadImageToFirebase = async uri => {
    try {
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const uploadUri =
        Platform.OS === 'ios' ? uri.replace('file://', '') : uri;

      // Create a reference to the Firebase Storage bucket
      const storageRef = storage().ref(`profilePics/${filename}`);
      const task = storageRef.putFile(uploadUri);

      // Listen for state changes, errors, and completion of the upload.
      task.on(
        'state_changed',
        snapshot => {
          console.log('Snapshot state: ', snapshot.state); // Shows the upload progress
        },
        error => {
          console.error('Error uploading image: ', error);
        },
        () => {
          // Handle successful uploads on complete
          task.snapshot.ref.getDownloadURL().then(downloadURL => {
            console.log('File available at', downloadURL);
            saveImageUri(downloadURL); // Save the download URL to Firestore
          });
        },
      );
    } catch (error) {
      console.error('Error updating profile picture: ', error);
      alert('Failed to update profile picture.');
    }
  };

  const saveImageUri = async uri => {
    try {
      const userRef = firestore().collection('users').doc(yourUserId);

      await userRef.update({
        profilePic: uri,
      });
      console.log('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating profile picture: ', error);
      alert('Failed to update profile picture.');
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      const fetchedDetails = await fetchUserDetails(userId);
      setIsProfileLiked(fetchedDetails.user_likes.includes(yourUserId));
    };
    fetchDetails();
  }, [isLiked]);

  useEffect(() => {
    setIsLiked(isProfileLiked);
  }, [isProfileLiked]);

  const toggleLike = async () => {
    const userRef = firestore().collection('users').doc(userId);
    try {
      let liked = isLiked; // Store the current state

      if (isLiked) {
        await userRef.update({
          user_likes: firestore.FieldValue.arrayRemove(yourUserId),
        });
      } else {
        await userRef.update({
          user_likes: firestore.FieldValue.arrayUnion(yourUserId),
        });
      }

      // Fetch the updated details
      const fetchedDetails = await fetchUserDetails(userId);
      const profileIsLiked = fetchedDetails.user_likes.includes(yourUserId);
      setIsProfileLiked(profileIsLiked);
      setIsLiked(!liked); // Update based on the previous state
      console.log(yourUserId, userId);
      // If the operation was to like the profile, send a notification
      if (!liked) {
        await axios.post(
          `${apiUrl}/send_profile_notification?sender_id=${yourUserId}&receiver_id=${userId}`,
        );
      }
    } catch (error) {
      console.error(
        'Error updating user likes or sending notification:',
        error,
      );
    }
  };

  const heartIconPath =
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'; // Path for a heart icon

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={yourUserId === userId ? pickImage : undefined}>
          <Image source={{uri: profilePic}} style={styles.image} />
        </TouchableOpacity>
        <View style={styles.textContainer}>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>
        </View>
        {yourUserId !== userId && (
          <TouchableOpacity onPress={toggleLike} style={styles.iconContainer}>
            <Svg height="40" width="40" viewBox="0 0 24 24">
              <Path
                d={heartIconPath}
                fill={isLiked ? '#c599f8' : '#202020'} // Conditional fill color
                stroke="white"
                strokeWidth="2"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
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
  iconContainer: {
    left: 150,
    top: 7,
  },
});

export default ProfileDetails;
