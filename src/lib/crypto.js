const CryptoJS = require('crypto-js');

/**
 * Generate a random salt value
 *
 * @returns {String} - A random salt
 *
 * @example
 *   generateSalt()
 */
const generateSalt = () =>
  CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);

/**
 * Generate a key based on a secret
 *
 * @param {String} secret - The secret to generate a key for
 * @param {String} salt - The salt
 * @param {Number} [iterations] - PBKDF2 iterations count (optional)
 * @returns {String} - 256-bit key
 *
 * @example
 *   generateKey('secret', 'salt')
 *   generateKey('secret', 'salt', 50000)
 */
const generateKey = (secret, salt, iterations = 100_000) =>
  CryptoJS.PBKDF2(secret, salt, {
    keySize: 256 / 32,
    iterations,
  }).toString(CryptoJS.enc.Hex);

/**
 * Encrypt the given state
 *
 * @param {String} state - The state to encrypt
 * @param {String} key - The key to be used for encryption
 * @returns {Object} - Encrypted state and the signature
 *
 * @example
 *   encryptState('{ foo: "bar"}', 'key')
 */
const encryptState = (state, key) => {
  const encryptedState = CryptoJS.AES.encrypt(state, key).toString();
  const signature = CryptoJS.HmacSHA256(encryptedState, key).toString(
    CryptoJS.enc.Hex
  );

  return {
    state: encryptedState,
    signature,
  };
};

/**
 * Decrypt the given state
 *
 * @param {String} encryptedState - The encrypted state
 * @param {String} key - The key used for encryption
 * @returns {String} - The decrypted state
 *
 * @example
 *   decryptState(encryptedState, 'key')
 */
const decryptState = (encryptedState, key) => {
  const decryptedState = CryptoJS.AES.decrypt(encryptedState, key).toString();

  return decryptedState;
};

/**
 * Check if a signature is valid
 *
 * @param {String} encryptedState - The encrypted state
 * @param {String} signature - The given signature
 * @param {String} key - The key used for encryption and signing
 * @returns {Boolean} - True if it was valid
 *
 * @example
 *   isStateValid(encryptedState, signature, 'key')
 */
const isStateValid = (encryptedState, signature, key) => {
  const _signature = CryptoJS.HmacSHA256(encryptedState, key).toString(
    CryptoJS.enc.Hex
  );

  return _signature === signature;
};

module.exports = {
  generateSalt,
  generateKey,
  encryptState,
};
