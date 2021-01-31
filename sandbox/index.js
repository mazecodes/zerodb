const ZeroDB = require('../src');

const zerodb = new ZeroDB('./database.json');

zerodb.init({ posts: [] }, { force: true });

// console.log(zerodb.initialState);

zerodb
  .push('posts', {
    id: 0,
    title: 'Test 1',
    author: 'John',
  })
  .push('posts', {
    id: 1,
    title: 'Test 2',
    author: 'John',
  })
  .push('posts', {
    id: 2,
    title: 'Test 3',
    author: 'Nick',
  })
  .push('posts', {
    id: 3,
    title: 'Test 4',
    author: 'Nick',
  });

const posts = zerodb.find('posts', {});
const johnPosts = zerodb.find('posts', { author: 'John' });
const onePost = zerodb.findOne('posts', {
  author: 'John',
  id: 10,
});
const withRegex = zerodb.find('posts', { title: /^Test/ });

console.log(zerodb.get('posts'));
// zerodb.delete('posts');
console.log(zerodb.get('posts'));

// console.log(posts);
// console.log(johnPosts);
// console.log(onePost);
// console.log(withRegex);

// zerodb.reset().save().then(console.log);
// console.log(zerodb.initialState);

zerodb.set('age', 18);
zerodb.increment('age');
zerodb.increment('age', 10);

zerodb.decrement('age');
zerodb.decrement('age', 10);

console.log(zerodb.get('age'));

zerodb.set('username', 'JoHn');
zerodb.update('username', value => value.toLowerCase());

console.log(zerodb.get('username'));

console.log(zerodb.getState());
