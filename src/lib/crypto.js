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

module.exports = {
  generateSalt,
};
