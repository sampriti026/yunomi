import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {FAB} from 'react-native-paper';
import {BlurView} from '@react-native-community/blur';

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
    flex: 1,
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  optionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 80,
  },
  optionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 20,
  },
  optionText: {
    color: 'black',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ExpandableFAB;
