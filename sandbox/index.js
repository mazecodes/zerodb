const ZeroDB = require('../src');

const zerodb = new ZeroDB('./database.json', {
  encryption: true,
  secret: 'hello WOrld',
});

console.log(zerodb.getState());
