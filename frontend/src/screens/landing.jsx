import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, StatusBar } from 'react-native';

function LandingPage() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A082D5" />
      <View style={styles.content}>
        <Text style={styles.title}>Yunomi</Text>
        <Text style={styles.subtitle}>
          A man would travel a ̰ thousand miles to meet he who understands him.
        </Text>
        <Text style={styles.question}>
          What if you didn't have to?
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#A082D5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 10,
    },
    question: {
      fontSize: 20,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    },
  });
  

export default LandingPage;
