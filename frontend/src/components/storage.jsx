import AsyncStorage from '@react-native-async-storage/async-storage';

export const setActiveChatId = async chatId => {
  try {
    await AsyncStorage.setItem('@ActiveChatId', chatId);
  } catch (error) {
    console.error('Error saving active chat id', error);
  }
};

export const removeActiveChatId = async () => {
  try {
    await AsyncStorage.removeItem('@ActiveChatId');
  } catch (error) {
    console.error('Error removing active chat id', error);
  }
};

export const getActiveChatId = async () => {
  try {
    return await AsyncStorage.getItem('@ActiveChatId');
  } catch (error) {
    console.error('Error fetching active chat id', error);
  }
};
