import {randomBytes, secretbox} from 'tweetnacl';
import {
  encode as encodeBase64,
  decode as decodeBase64,
} from '@stablelib/base64';
import {encode as encodeUTF8, decode as decodeUTF8} from '@stablelib/utf8';
import * as Keychain from 'react-native-keychain';

// Generate and save a symmetric key securely
export const generateAndSaveKey = async () => {
  const key = randomBytes(secretbox.keyLength);
  const keyBase64 = encodeBase64(key);
  await Keychain.setGenericPassword('user', keyBase64, {
    service: 'com.yunomi.symmetricKey',
  });
  return keyBase64;
};

// Load the symmetric key securely
export const loadKey = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.yunomi.symmetricKey',
    });
    if (credentials) {
      console.log(decodeBase64(credentials.password), 'passssword');
      return decodeBase64(credentials.password);
    }
  } catch (error) {
    console.error('Error loading the key from secure storage:', error);
  }
};

// Encrypt a message
export const encryptMessage = async (message, key) => {
  const nonce = randomBytes(secretbox.nonceLength);
  const messageUint8 = decodeUTF8(message); // Directly decode the message to Uint8Array
  const box = secretbox(messageUint8, nonce, key);
  return {
    nonce: encodeBase64(nonce),
    box: encodeBase64(box),
  };
};

// Decrypt a message
export const decryptMessage = async (box, nonce, key) => {
  const boxUint8 = decodeBase64(box);
  const nonceUint8 = decodeBase64(nonce);
  const messageUint8 = secretbox.open(boxUint8, nonceUint8, key);
  if (!messageUint8) {
    throw new Error('Decryption failed.');
  }
  return encodeUTF8(messageUint8); // Encode decrypted Uint8Array back to string
};
