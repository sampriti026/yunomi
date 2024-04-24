// Function to decrypt the encrypted text
const decryptText = encryptedText => {
  // Your provided secret key
  const keyString = 'ftNm7SeeApUK0MUP2J4M83XlntR8tTgqE9TWP0IMenw=';

  // Create a secret with your key
  const secret = new Fernet.Secret(keyString);

  // Create a token with the encrypted text and the secret key
  const token = new Fernet.Token({
    secret: secret,
    token: encryptedText,
    ttl: 0, // Disables time-to-live functionality
  });

  // Decrypt the token to get the original message
  return new Promise((resolve, reject) => {
    token.decode((err, message) => {
      if (err) {
        reject(err);
      } else {
        resolve(message);
      }
    });
  });
};

// Example usage:
const encryptedText = 'YOUR_ENCRYPTED_TEXT_HERE'; // Replace this with the encrypted text you want to decrypt

decryptText(encryptedText)
  .then(decryptedMessage => {})
  .catch(error => {
    console.error('Decryption Error:', error);
  });
