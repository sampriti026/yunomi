from cryptography.fernet import Fernet

# Function to generate a new encryption key
def generate_key():
    return Fernet.generate_key()

# Function to save the encryption key to a file for later use
def save_key(key, filename="secret.key"):
    with open(filename, "wb") as key_file:
        key_file.write(key)

# Function to load the encryption key from a file
def load_key(filename="secret.key"):
    with open(filename, "rb") as key_file:
        return key_file.read()

# Function to encrypt text
def encrypt_text(plain_text, key):
    fernet = Fernet(key)
    encrypted_text = fernet.encrypt(plain_text.encode())
    return encrypted_text.decode()

# Function to decrypt text
def decrypt_text(encrypted_text, key):
    fernet = Fernet(key)
    decrypted_text = fernet.decrypt(encrypted_text.encode())
    return decrypted_text.decode()

