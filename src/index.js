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

    if (!this.source) {
      throw new Error('Database source should be provided');
    }

    if (typeof this.source !== 'string') {
      throw new Error('Database source should be a valid string');
    }

    if (path.extname(this.source) !== '.json') {
      throw new Error('Database source should be JSON');
    }

    const filePath = path.resolve(require.main.path, this.source);
    const fileExists = fs.existsSync(filePath);

    if (!fileExists) {
      fs.writeFileSync(filePath, '{}');
    } else {
      try {
        const data = fs.readFileSync(filePath);
        const database = JSON.parse(data);

        this.database = database;
      } catch (err) {
        throw new Error('Database source contains malformed JSON');
      }
    }
  }
}

module.exports = ZeroDB;
