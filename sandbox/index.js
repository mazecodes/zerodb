const ZeroDB = require('../src');

const zerodb = new ZeroDB('./database.json');

zerodb.database = {
  foo: 'bar',
};

zerodb.save().then(console.log);
