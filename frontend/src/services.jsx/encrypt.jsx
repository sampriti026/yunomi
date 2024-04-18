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

export const loadKey = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: 'com.yunomi.symmetricKey',
    });
    if (credentials) {
      // Decode from Base64 and return Uint8Array
      return decodeBase64(credentials.password);
    }
  } catch (error) {
    console.error('Error loading the key from secure storage:', error);
  }
};

// Encrypt a message
export const encryptMessage = async message => {
  const key = await loadKey();
  const nonce = randomBytes(secretbox.nonceLength);

  // Correctly encode the message string to Uint8Array using encodeUTF8
  const messageUint8 = encodeUTF8(message);

  const box = secretbox(messageUint8, nonce, key);

  return {
    nonce: encodeBase64(nonce),
    box: encodeBase64(box),
  };
};

export const encryptAndCombine = async message => {
  const {nonce, box} = await encryptMessage(message);
  return `${nonce}:${box}`; // Use a delimiter like ':' to separate the nonce and box
};

// Decrypt a message
export const decryptMessage = async (box, nonce, keyUint8) => {
  const boxUint8 = decodeBase64(box);
  const nonceUint8 = decodeBase64(nonce);

  const messageUint8 = secretbox.open(boxUint8, nonceUint8, keyUint8);
  if (!messageUint8) {
    throw new Error('Decryption failed.');
  }

  return decodeUTF8(messageUint8);
};

// Decrypt a combined string of nonce + box (both base64-encoded)
export const decryptCombined = async combined => {
  const [nonce, box] = combined.split(':'); // Split by the same delimiter used in encryptAndCombine
  const keyUint8 = await loadKey();
  console.log(keyUint8);

  if (!keyUint8) {
    console.error('Key loading failed or returned undefined.');
    throw new Error('Encryption key is unavailable.');
  }

  return await decryptMessage(box, nonce, keyUint8); // Now passing the binary key directly
};
