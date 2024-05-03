import firestore from '@react-native-firebase/firestore';
import CryptoJS from 'crypto-js';

let key = null;

async function fetchAndCacheEncryptionKey() {
  try {
    const document = await firestore().collection('key').doc('password').get();
    if (document.exists) {
      console.log('Key successfully loaded from Firestore.');
      key = document.data().key; // Cache the key globally
    } else {
      console.warn('No key found in Firestore.');
    }
  } catch (error) {
    console.error('Error loading the key from Firestore:', error);
  }
}

// Function to ensure the key is loaded
async function ensureKeyIsLoaded() {
  if (!key) {
    await fetchAndCacheEncryptionKey();
  }
  if (!key) {
    throw new Error('Encryption key could not be loaded.');
  }
}

// Function to encrypt a message using AES
export const encryptMessage = async message => {
  await ensureKeyIsLoaded();
  console.log(key, 'key');
  const keyHex = CryptoJS.enc.Hex.parse(key); // Parse key from hex
  const iv = CryptoJS.lib.WordArray.random(128 / 8); // Generate a 16-byte IV for AES
  const encrypted = CryptoJS.AES.encrypt(message, keyHex, {
    iv: iv,
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.NoPadding,
  });
  return iv.toString(CryptoJS.enc.Hex) + encrypted.toString(); // Return IV + encrypted data
};

// Function to decrypt a message using AES
export const decryptMessage = async ciphertext => {
  await ensureKeyIsLoaded();
  const ivHex = ciphertext.substring(0, 32); // Extract the IV from the ciphertext
  const encryptedText = ciphertext.substring(32); // The rest is the encrypted data
  const keyHex = CryptoJS.enc.Hex.parse(key); // Parse key from hex
  const iv = CryptoJS.enc.Hex.parse(ivHex); // Parse IV from hex

  const decrypted = CryptoJS.AES.decrypt(encryptedText, keyHex, {
    iv: iv,
    mode: CryptoJS.mode.CFB,
    padding: CryptoJS.pad.NoPadding,
  });
  return decrypted.toString(CryptoJS.enc.Utf8); // Convert decrypted data to Utf8 string
};
