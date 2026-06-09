import CryptoJS from 'crypto-js';
import { jwtDecode } from 'jwt-decode';

/**
 * Encrypt data using AES
 * @param {any} data - Data to encrypt (object, array, string)
 * @param {string} key - Symmetric key
 * @returns {string} - Ciphertext
 */
export const encryptData = (data, key) => {
  if (!key) throw new Error("Encryption key is required");
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(plaintext, key).toString();
};

/**
 * Decrypt data using AES
 * @param {string} ciphertext - Ciphertext to decrypt
 * @param {string} key - Symmetric key
 * @returns {any} - Decrypted data
 */
export const decryptData = (ciphertext, key) => {
  if (!key) throw new Error("Decryption key is required");
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
  if (!decryptedText) {
    throw new Error("Failed to decrypt data (incorrect key or corrupted data)");
  }
  try {
    return JSON.parse(decryptedText);
  } catch (e) {
    // If it's not a JSON string, return it as a plain string
    return decryptedText;
  }
};

/**
 * Create offline key vault by encrypting Google ID with PIN
 * @param {string} googleUserId - Google User ID
 * @param {string} pin - 4-6 digit PIN
 * @returns {string} - Encrypted vault payload
 */
export const createOfflineVault = (googleUserId, pin) => {
  const payload = {
    googleUserId,
    sentinel: "SECURE_NOTES_VAULT"
  };
  return encryptData(payload, pin);
};

/**
 * Decrypt offline key vault using PIN to retrieve Google ID
 * @param {string} vaultCiphertext - Encrypted vault payload from localStorage
 * @param {string} pin - 4-6 digit PIN
 * @returns {string|null} - Decrypted Google User ID, or null if failed
 */
export const decryptOfflineVault = (vaultCiphertext, pin) => {
  try {
    const payload = decryptData(vaultCiphertext, pin);
    if (payload && payload.sentinel === "SECURE_NOTES_VAULT") {
      return payload.googleUserId;
    }
  } catch (error) {
    console.error("PIN decryption failed", error);
  }
  return null;
};

/**
 * Decode JWT token from Google Identity Services
 * @param {string} credential - JWT token
 * @returns {object} - Decoded token payload
 */
export const decodeGoogleCredential = (credential) => {
  try {
    return jwtDecode(credential);
  } catch (error) {
    console.error("Failed to decode credential using jwt-decode", error);
    // Fallback: manually parse JWT if jwt-decode fails
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Manual decode fallback failed", e);
      throw new Error("Unable to parse credential token");
    }
  }
};
