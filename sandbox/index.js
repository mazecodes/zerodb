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
zerodb.delete('posts');
console.log(zerodb.get('posts'));

// console.log(posts);
// console.log(johnPosts);
// console.log(onePost);
// console.log(withRegex);

// zerodb.reset().save().then(console.log);
// console.log(zerodb.initialState);
