const ZeroDB = require('../src');

const zerodb = new ZeroDB('./database.json');

// zerodb.database = {
//   foo: 'bar',
// };

// zerodb.set('user.name', 'John Doe 1').save();

zerodb.set('name', 'John Doe');

console.log(zerodb.get('namse', 'default'));

zerodb.push('test', 'hello').push('test', 'world').save();
