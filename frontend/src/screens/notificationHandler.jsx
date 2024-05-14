import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';

const NotificationHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribeFromMessaging = setupForegroundMessageHandler(navigation);
    return () => {
      unsubscribeFromMessaging();
    };
  }, [navigation]);

  return null; // This component does not render anything
};
