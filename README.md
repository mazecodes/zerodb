<div align="center">
  <h1>ZeroDB</h1>
  <p><i>Easy to use JSON database for Node.js with encryption.</i></p>
</div><br>

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Encryption](#encryption)
- [Contributing](#contributing)
- [Author](#author)
- [Support](#show-your-support)
- [License](#license)

## Install

npm:

```bash
npm install zerodb
```

Yarn:

```bash
yarn add zerodb
```

GitHub:

```bash
git clone https://github.com/mazecodes/zerodb.git
```

## Usage

### Basic Usage

Load a database:

```javascript
const ZeroDB = require('zerodb');

const db = new ZeroDB('./database.json');
```

If the database doesn't exist, ZeroDB will create a new one.

Adding defaults:

```javascript
db.init({
  posts: [],
  user: {},
});
```

You can also force the database to replace the current state with the initial state:

```javascript
db.init(
  {
    posts: [],
    user: [],
  },
  { force: true }
);
```

Save the database:

```javascript
await db.save();
```

Set a value:

```javascript
db.set('user.name', 'John Doe');
```

You can set multiple values with chaining:

```javascript
db.set('user.name', 'John Doe')
  .set('user.age', 18)
  .set('user.email', 'john@doe.com');
```

Get a value:

```javascript
db.get('user.name');
```

You can also provide a fallback value:

```javascript
db.get('user.admin', false);
```

Push to an array:

```javascript
db.push('posts', {
  id: 0,
  title: 'Hello World',
});
```

You can also push multiple values with chaining:

```javascript
db.push('posts', {
  id: 0,
  title: 'Hello World 1',
})
  .push('posts', {
    id: 1,
    title: 'Hello World 2',
  })
  .push('posts', {
    id: 2,
    title: 'Hello World 3',
  })
  .push('posts', {
    id: 3,
    title: 'Hello World 4',
  });
```

ZeroDB will set a new array if the pushing path doesn't exist.

Check if a property exists:

```javascript
db.has('user.name'); // true
```

Delete a propery:

```javascript
db.delete('user.name');
db.has('user.name'); // false
```

Reset the database to its initial state:

```javascript
db.reset();
```

Find all the matches:

```javascript
db.find('posts', { author: 'John' });
```

You can also use RegExp:

```javascript
db.find('posts', { title: /^Hello/ });
```

Find only the first match:

```javascript
db.findOne('post', { id: 0 });
```

Increase the value:

```javascript
db.increment('user.age'); // Increase by 1
db.increment('user.age', 5); // Increase by 5
```

Decrease the value:

```javascript
db.decrement('user.age'); // Decrease by 1
db.decrement('user.age', 5); // Decrease by 5
```

Update a property based on its last value:

```javascript
db.update('user.name', name => name.toLowerCase());
```

Get the current state of the database:

```javascript
db.getState();
```

Replace the current state:

```javascript
db.setState({ foo: 'bar' });
```

### Encryption

You can use encryption with ZeroDB like this:

```javascript
new ZeroDB('./database.json', {
  encryption: true,
  secret: 's3cr3t',
  iterations: 50_000,
});
```

`iterations` is the number of iterations used for key derivation. The encryption key will be derived from `secret`.

ZeroDB uses **PBKDF2** for key derivation with default iterations set to **50,000** and uses **AES256** for encryption. It will also use **HMAC-SHA256** for signing the state.

**Note**: The encryption will only happen when the database is being saved.

## Contributing

All contributions, issues and feature requests are welcome!<br>
Please feel free to check [issues page](https://github.com/mazecodes/zerodb/issues).

1. Fork the project
1. Create your feature branch (`git checkout -b feature/AwesomeFeature`)
1. Commit your changes (`git commit -m "Add Awesome Feature"`)
1. Push to the branch (`git push origin feature/AwesomeFeature`)
1. Open a Pull Request

## Author

Maze Peterson:

- Twitter: [mazecodes](https://twitter.com/mazecodes)
- GitHub: [mazecodes](https://github.com/mazecodes)
- npm: [mazecodes](https://npmjs.com/~mazecodes)

## Show your support

Give a ⭐ if you liked this project!

## License

[MIT](https://github.com/mazecodes/zerodb/blob/master/LICENSE) © Maze Peterson
