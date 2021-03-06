const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const _ = require('lodash');
const shallowEqual = require('shallowequal');
const isRegex = require('is-regex');
const cloneDeep = require('clone-deep');

const crypto = require('./lib/crypto');

class ZeroDB {
  /**
   * @constructor
   *
   * @param {String} source - Database source
   * @param {Object} [options] - The custom options (optional)
   * @param {Boolean} [options.encryption] - If there should be encryption/decryption
   * @param {String} [options.secret] - The secret to use for encryption/decryption (Required if the encryption is true)
   * @param {Number} [options.iterations] - The number of iterations for key generation
   * @param {Boolean} [options.empty] - If it should create an empty database anyway
   * @returns {void}
   *
   * @example
   *   new ZeroDB('./database.json')
   */
  constructor(source, options = {}) {
    this.source = source;
    this.filePath = '';
    this.database = {};
    this.initialState = {};

    this.encryption = !!options.encryption;
    this.secret = options.secret || '';
    this.iterations = options.iterations || 50000;
    this.salt = '';

    this.empty = !!options.empty;

    this.validateSource();
    this.validateCrypto();

    this.readDatabase();
  }

  /**
   * @property {Function} validateSource - Validate the database source
   * @access private
   *
   * @returns {void}
   *
   * @example
   *   zerodb.validateSource()
   */
  validateSource() {
    if (!this.source) {
      throw new Error('Database source should be provided');
    }

    if (typeof this.source !== 'string') {
      throw new Error('Database source should be a valid string');
    }

    if (path.extname(this.source) !== '.json') {
      throw new Error('Database source should be JSON');
    }
  }

  /**
   * @property {Function} validateCrypto - Validate the crypto config
   * @access private
   *
   * @returns {void}
   *
   * @example
   *   zerodb.validateCrypto()
   */
  validateCrypto() {
    if (this.encryption) {
      if (!this.secret) {
        throw new Error('The secret must be provided for encryption');
      }

      if (typeof this.secret !== 'string') {
        throw new Error('The secret must be a string');
      }

      if (typeof this.iterations !== 'number') {
        throw new Error('The iterations must be a number');
      }
    }
  }

  /**
   * @property {Function} validateState - Validate the given state
   * @access private
   *
   * @param {*} state - State to validate
   * @returns {void}
   *
   * @example
   *   zerodb.validateState({ foo: 'bar' })
   */
  validateState(state) {
    if (typeof state !== 'object') {
      throw new Error('State should be an object');
    }
  }

  /**
   * @property {Function} readDatabase - Read the database, create one if it doesn't exists
   * @access private
   *
   * @returns {void}
   *
   * @example
   *   zerodb.readDatabase()
   */
  readDatabase() {
    const filePath = path.resolve(require.main.path, this.source);
    const fileExists = fs.existsSync(filePath);

    this.filePath = filePath;

    if (fileExists && !this.empty) {
      const stats = fs.statSync(this.filePath);
      const isFile = stats.isFile();

      if (!isFile) {
        throw new Error('Database source should be a file');
      }

      try {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const database = JSON.parse(data);

        if (this.encryption) {
          if (!database._encryption) {
            this.salt = crypto.generateSalt();
            this.key = crypto.generateKey(
              this.secret,
              this.salt,
              this.iterations
            );
            this.database = database;

            const encryptedState = this.encryptState();

            fs.writeFileSync(
              this.filePath,
              JSON.stringify(encryptedState),
              'utf-8'
            );
          } else {
            this.decryptDatabase(database);
          }
        } else {
          this.database = database;
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          throw new Error('Database source contains malformed JSON');
        }

        throw err;
      }
    } else {
      this.createDatabase();
    }
  }

  /**
   * @property {Function} generateKey - Generate a key based on encryption config
   * @access private
   *
   * @returns {String} - An encryption key
   *
   * @example
   *   zerodb.generateKey()
   */
  generateKey() {
    return crypto.generateKey(this.secret, this.salt, this.iterations);
  }

  /**
   * @property {Function} decryptDatabase - Decrypt the given database
   * @access private
   *
   * @param {Object} database - The database to decrypt
   * @returns {void}
   *
   * @example
   *   zerodb.decryptDatabase(db)
   */
  decryptDatabase(database) {
    const { salt, iterations } = database._encryption;

    this.salt = !salt ? crypto.generateSalt() : salt;
    this.iterations =
      typeof iterations === 'number' ? iterations : this.iterations;

    this.key = this.generateKey();

    const stateContent = database.state.content;
    const stateSignature = database.state.signature;

    if (!stateContent || !stateSignature) {
      throw new Error('The state is not valid');
    }

    const isStateValid = crypto.isStateValid(
      stateContent,
      stateSignature,
      this.key
    );

    if (!isStateValid) {
      throw new Error('The state has been altered');
    }

    const decryptedState = crypto.decryptState(stateContent, this.key);

    this.database = JSON.parse(decryptedState);
  }

  /**
   * @property {Function} createDatabase - Create a database
   * @access private
   *
   * @returns {void}
   *
   * @example
   *   zerodb.createDatabase('/path/to/db.json')
   */
  createDatabase() {
    let data = '{}';

    if (this.encryption) {
      this.salt = crypto.generateSalt();
      this.key = crypto.generateKey(this.secret, this.salt, this.iterations);

      const encryptedState = this.encryptState();

      data = JSON.stringify(encryptedState);
    }

    fs.writeFileSync(this.filePath, data, 'utf-8');
  }

  /**
   * @property {Function} encryptState - Encrypt the current state
   * @access private
   *
   * @returns {Object} - An object containing the state and encryption config
   *
   * @example
   *   zerodb.encryptState()
   */
  encryptState() {
    const state = JSON.stringify(this.database);
    const encryptedState = crypto.encryptState(state, this.key);

    const stateObject = {
      _encryption: {
        salt: this.salt,
        iterations: this.iterations,
      },
      state: {
        content: encryptedState.state,
        signature: encryptedState.signature,
      },
    };

    return stateObject;
  }

  /**
   * @property {Function} init - Set initial state of the database
   *
   * @param {Object} initialState - The initial state
   * @param {Object} [options] - The options object (optional)
   * @param {Boolean} [options.force] - If the database should be replaced with the initial state (optional)
   * @returns {Object} - The ZeroDB database
   *
   * @example
   *   zerodb.init({ posts: [] })
   *   zerodb.init({ posts: [] }, { force: true })
   */
  init(initialState = {}, options = {}) {
    this.validateState(initialState);
    this.initialState = cloneDeep(initialState);

    const isForced = options.force;
    const isEmpty = Object.keys(this.database).length === 0;

    if (isEmpty || isForced) {
      this.database = initialState;
    }

    return this;
  }

  /**
   * @property {Function} save - Save the database
   *
   * @returns {Boolean} - True if it was successful
   *
   * @example
   *   zerodb.save()
   */
  async save() {
    const writeFile = promisify(fs.writeFile);
    const data = this.encryption
      ? JSON.stringify(this.encryptState())
      : JSON.stringify(this.database);

    await writeFile(this.filePath, data, 'utf-8');
    return true;
  }

  /**
   * @property {Function} set - Set a value
   *
   * @param {String} path - Path to set
   * @param {*} value - Value to set
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.set('user.name', 'John Doe')
   */
  set(path, value) {
    _.set(this.database, path, value);

    return this;
  }

  /**
   * @property {Function} get - Get a value
   *
   * @param {String} path - Path to get the value from
   * @param {*} defaultValue - The default value
   * @returns {*} - The main value if it exists or the default value
   *
   * @example
   *   zerodb.get('name')
   *   zerodb.get('post.title', 'Title')
   */
  get(path, defaultValue = null) {
    const data = _.get(this.database, path, defaultValue);

    return cloneDeep(data);
  }

  /**
   * @property {Function} push - Push a value into an array
   *
   * @param {String} path - Path to push the value to
   * @param {*} value - The value to push
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.push('posts', { title: 'Foo' })
   */
  push(path, value) {
    const destination = _.get(this.database, path);

    if (!destination) {
      this.set(path, [value]);

      return this;
    }

    if (!(destination instanceof Array)) {
      throw new Error('You can only push values to an array');
    }

    destination.push(value);

    return this;
  }

  /**
   * @property {Function} has - Check if a property exists
   *
   * @param {String} path - Path to check
   * @returns {Boolean} - True if exists
   *
   * @example
   *   zerodb.has('posts')
   *   zerodb.has('user.name')
   */
  has(path) {
    return _.has(this.database, path);
  }

  /**
   * @property {Function} find - Find objects which match with the query
   *
   * @param {String} path - Path to find in
   * @param {Object} query - The query to search for
   * @returns {(null|Array)} - The result, null if it found nothing
   *
   * @example
   *   zerodb.find('posts', { author: 'John' })
   *   zerodb.find('posts', { title: /^Hello/ })
   */
  find(path, query) {
    const destination = this.get(path);

    if (typeof query !== 'object') {
      throw new Error('Query must be an object');
    }

    if (!destination || !(destination instanceof Array)) {
      return null;
    }

    const foundings = destination.filter(data => {
      for (const key of Object.keys(query)) {
        if (isRegex(query[key])) {
          if (typeof data[key] !== 'string') {
            return false;
          }

          if (!query[key].test(data[key])) {
            return false;
          }
        } else {
          if (!shallowEqual(query[key], data[key])) {
            return false;
          }
        }
      }

      return true;
    });

    return foundings;
  }

  /**
   * @property {Function} findOne - Find one object which matches with the query
   *
   * @param {String} path - Path to find in
   * @param {*} query - The query to search for
   * @returns {(null|Object)} - The result, null if it found nothing
   *
   * @example
   *   zerodb.findOne('posts', { id: 0 })
   */
  findOne(path, query) {
    const result = this.find(path, query);

    if (!result) {
      return null;
    }

    return result.length !== 0 ? result[0] : null;
  }

  /**
   * @property {Function} reset - Reset the database to its initial state
   *
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.reset()
   */
  reset() {
    this.database = this.initialState;

    return this;
  }

  /**
   * @property {Function} delete - Delete the given path
   *
   * @param {String} path - Path to delete
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.delete('user.name')
   */
  delete(path) {
    _.unset(this.database, path);

    return this;
  }

  /**
   * @property {Function} increment - Increase the value of the given path
   *
   * @param {String} path - The path to increase
   * @param {Number} [amount] - The amount to add (optional)
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.increment('age')
   *   zerodb.increment('age', 5)
   */
  increment(path, amount = 1) {
    if (typeof amount !== 'number') {
      throw new Error('The amount to increase must be a number');
    }

    const currentValue = this.get(path);

    if (!currentValue) {
      throw new Error(`Path '${path}' doesn't exist`);
    }

    if (typeof currentValue !== 'number') {
      throw new Error('You can only increase number values');
    }

    const increasedValue = currentValue + amount;

    return this.set(path, increasedValue);
  }

  /**
   * @property {Function} decrement - Decrease the value of the given path
   *
   * @param {String} path - The path to decrease
   * @param {Number} [amount] - The amount to subtract (optional)
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.decrement('age')
   *   zerodb.decrement('age', 5)
   */
  decrement(path, amount = 1) {
    if (typeof amount !== 'number') {
      throw new Error('The amount to decrease must be a number');
    }

    const currentValue = this.get(path);

    if (!currentValue) {
      throw new Error(`Path '${path}' doesn't exist`);
    }

    if (typeof currentValue !== 'number') {
      throw new Error('You can only decrease number values');
    }

    const decreasedValue = currentValue - amount;

    return this.set(path, decreasedValue);
  }

  /**
   * @property {Function} update - Update the given path the updater
   *
   * @param {String} path - The path to update
   * @param {Function} updater - The updater function
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.update('username', value => value.toLowerCase())
   */
  update(path, updater) {
    if (typeof updater !== 'function') {
      throw new Error('Updater must be a function');
    }

    const currentValue = this.get(path);

    if (!currentValue) {
      throw new Error(`Path '${path}' doesn't exist`);
    }

    const newValue = updater(currentValue);

    return this.set(path, newValue);
  }

  /**
   * @property {Function} getState - Get the current state of the database
   *
   * @returns {Object} - The current state of the database
   *
   * @example
   *   zerodb.getState()
   */
  getState() {
    const state = this.database;

    return cloneDeep(state);
  }

  /**
   * @property {Function} setState - Replace the current state with a new one
   *
   * @param {Object} state - The new state
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.setState({ foo: 'bar' })
   */
  setState(state) {
    this.validateState(state);
    this.database = state;

    return this;
  }

  /**
   * @property {Function} destroy - Destroy the database
   *
   * @param {Boolean} removeDatabase - If it should removes the database file
   * @returns {Object} - The ZeroDB object
   *
   * @example
   *   zerodb.destroy()
   *   zerodb.destroy(false)
   */
  destroy(removeDatabase = true) {
    this.database = {};
    this.initialState = {};

    if (removeDatabase) {
      fs.unlinkSync(this.filePath);
    }

    return this;
  }
}

module.exports = ZeroDB;
