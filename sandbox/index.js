const ZeroDB = require('../src');

const zerodb = new ZeroDB('./database.json', {
  encryption: true,
  secret: 'hello WOrld',
  // empty: true,
});

// zerodb.init({ username: 'Hello World' }).reset().save();

console.log(zerodb.getState());
