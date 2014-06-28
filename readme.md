# sort-keys [![Build Status](https://travis-ci.org/sindresorhus/sort-keys.svg?branch=master)](https://travis-ci.org/sindresorhus/sort-keys)

> Sort the keys of an object

Useful to get a deterministically ordered object as the order of keys can vary between engines.


## Install

```sh
$ npm install --save sort-keys
```


## Usage

```js
var sortKeys = require('sort-keys');

sortKeys({c: 0, a: 0, b: 0});
//=> {a: 0, b: 0, c: 0}

sortKeys({c: 0, a: 0, b: 0}, function (a, b) {
	return -a.localeCompare(b);
});
//=> {c: 0, b: 0, a: 0}
```


## API

### sortKeys(input, [compare])

Returns a new object with sorted keys.

#### input

*Required*  
Type: `object`

#### compare

Type: `function`

[Compare function.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
