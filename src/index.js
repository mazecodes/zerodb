const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const _ = require('lodash');
const shallowEqual = require('shallowequal');
const isRegex = require('is-regex');
const cloneDeep = require('clone-deep');

class ZeroDB {
  /**
   * @constructor
   *
   * @param {String} source - Database source
   * @returns {void}
   *
   * @example
   *   new ZeroDB('./database.json')
   */
  constructor(source, options = {}) {
    this.source = source;
    this.database = {};
    this.initialState = {};

    this.encrypt = !!options.encrypt;
    this.secret = options.secret || '';

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
    if (this.encrypt) {
      if (!this.secret) {
        throw new Error('The secret must be provided for encryption');
      }

      if (typeof secret !== 'string') {
        throw new Error('The secret must be a string');
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

    if (fileExists) {
      const stats = fs.statSync(filePath);
      const isFile = stats.isFile();

      if (!isFile) {
        throw new Error('Database source should be a file');
      }

      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const database = JSON.parse(data);

        this.database = database;
      } catch (err) {
        throw new Error('Database source contains malformed JSON');
      }
    } else {
      fs.writeFileSync(filePath, '{}');
    }
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
    const filePath = path.resolve(require.main.path, this.source);
    const data = JSON.stringify(this.database);

    await writeFile(filePath, data, 'utf-8');
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
      for (let key of Object.keys(query)) {
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
}

module.exports = ZeroDB;
