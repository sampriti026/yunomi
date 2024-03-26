import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';

// ContactCard.js

const ContactCard = ({displayName, onCardClick, logoUri}) => {
  return (
    <TouchableOpacity style={styles.contactCard} onPress={onCardClick}>
      <View style={styles.contentRow}>
        <Image source={{uri: logoUri}} style={styles.logo} />
        <Text style={styles.contactName}>{displayName}</Text>
      </View>
      {/* Add more user details here if necessary */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contactCard: {
    backgroundColor: '#383838', // Gray color for the chat bubble
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    maxWidth: '50%',
    padding: 10,
    marginBottom: 5,
    marginLeft: 10,
    flexDirection: 'row', // Change to row to align items horizontally
    alignItems: 'center', // Align items in the center of the flexDirection
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 24, // Set your desired logo width
    height: 24, // Set your desired logo height
    marginRight: 10, // Margin between logo and name
  },
  contactName: {
    color: '#ADD8E6', // Light blue color to indicate clickable text
    fontSize: 16,
    textDecorationLine: 'underline', // Underline to suggest it's clickable
  },
  // Add styles for additional user details here
});

export default ContactCard;
