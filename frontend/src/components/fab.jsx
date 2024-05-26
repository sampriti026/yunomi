import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import {FAB} from 'react-native-paper';
import {BlurView} from '@react-native-community/blur';
const windowWidth = Dimensions.get('window').width; // Get the window width
const windowHeight = Dimensions.get('window').height; // Get the window height

const ExpandableFAB = ({onSendMessage}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {isExpanded && (
        <BlurView
          style={styles.absolute}
          blurType="dark"
          blurAmount={15}
          reducedTransparencyFallbackColor="black"
        />
      )}
      {isExpanded && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => onSendMessage(true, true)}>
            <Text style={styles.optionText}>Send a private message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => onSendMessage(false, false)}>
            <Text style={styles.optionText}>
              Send a message that people can read
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FAB
        style={styles.fab}
        icon={isExpanded ? 'close' : 'message'}
        onPress={handleToggleExpand}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', // Ensuring the FAB doesn't take more space
    width: windowWidth, // Set width to window width
    height: windowHeight, // Set height to window height
  },
  absolute: {
    position: 'absolute',
    width: windowWidth, // Ensure the blur view covers the whole screen
    height: windowHeight, // Ensure the blur view covers the whole screen
  },
  optionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 110, // Position it above the FAB
  },
  optionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    borderRadius: 20,
  },
  optionText: {
    color: 'black',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 50,
  },
});

export default ExpandableFAB;
