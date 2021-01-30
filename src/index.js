const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const _ = require('lodash');

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
    this.initialState = initialState;

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
}

module.exports = ZeroDB;
