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

export const setUserToken = async userToken => {
  try {
    await AsyncStorage.setItem('@UserToken', userToken);
  } catch (error) {
    console.error('Error saving user token', error);
  }
};

// Function to remove userToken
export const removeUserToken = async () => {
  try {
    await AsyncStorage.removeItem('@UserToken');
  } catch (error) {
    console.error('Error removing user token', error);
  }
};

// Function to retrieve userToken
export const getUserToken = async () => {
  try {
    return await AsyncStorage.getItem('@UserToken');
  } catch (error) {
    console.error('Error fetching user token', error);
  }
};
