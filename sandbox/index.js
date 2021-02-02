const ZeroDB = require('../src');

const zdb = new ZeroDB('./database.json', {
  encryption: true,
  secret: 's3cr3t',
});

zdb.init({ posts: [], user: {} }, { force: true });

zdb.set('user.name', 'John Doe');

zdb
  .push('posts', {
    id: 0,
    title: 'Title 1',
  })
  .push('posts', {
    id: 1,
    title: 'Title 2',
  })
  .push('posts', {
    id: 2,
    title: 'Title 3',
  });

console.log(zdb.get('user.name'));

const post = zdb.findOne('posts', { id: 0 });

console.log(post);

console.log(zdb.has('posts'));

zdb.delete('posts');
zdb.reset();

zdb.set('user.age', 18);
zdb.increment('user.age');
zdb.increment('user.age', 10);
zdb.decrement('user.age');
zdb.decrement('user.age', 5);

console.log(zdb.get('user.age'));

zdb.set('user.name', 'John Doe');

zdb.update('user.name', name => name.toLowerCase());
console.log(zdb.get('user.name'));

console.log(zdb.getState());

zdb
  .setState({
    posts: [
      {
        title: 'Test',
      },
    ],
  })
  .save()
  .then(() => console.log('Saved'));

zdb.destroy();
