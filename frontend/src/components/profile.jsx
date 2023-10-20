import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import photo from '../assets/photo.png';

const Profile = ({contact, onPress}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={contact.dp} style={styles.dp} />
      <Text style={styles.name}>{contact.name}</Text>
    </TouchableOpacity>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  dp: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  name: {
    fontSize: 16,
  },
};

export default Profile;
