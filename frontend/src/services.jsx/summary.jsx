import {useEffect, useState} from 'react';
import firestore from '@react-native-firebase/firestore';

export const useRealTimeSummary = conversationId => {
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('conversations')
      .doc(conversationId)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists) {
          const data = documentSnapshot.data();
          setSummary(data.summary || '');
        }
      });

    return () => unsubscribe();
  }, [conversationId]);

  return summary;
};
