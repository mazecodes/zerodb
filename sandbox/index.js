const ZeroDB = require('../src');

const zerodb = new ZeroDB('./database.json');

zerodb.database = {
  foo: 'bar',
};

zerodb.set('user.name', 'John Doe 1').save();
