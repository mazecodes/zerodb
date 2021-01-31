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
  constructor(source) {
    this.source = source;
    this.database = {};
    this.initialState = {};

    this.validateSource();
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
    return _.get(this.database, path, defaultValue);
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
    const destination = _.get(this.database, path);

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
}

module.exports = ZeroDB;
