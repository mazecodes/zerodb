const path = require('path');
const fs = require('fs');

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
}

module.exports = ZeroDB;
