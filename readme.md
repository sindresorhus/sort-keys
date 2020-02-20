# sort-keys [![Build Status](https://travis-ci.org/sindresorhus/sort-keys.svg?branch=master)](https://travis-ci.org/sindresorhus/sort-keys)

> Sort the keys of an object

Useful to get a deterministically ordered object, as the order of keys can vary between engines.


## Install

```
$ npm install sort-keys
```


## Usage

```js
const sortKeys = require('sort-keys');

sortKeys({c: 0, a: 0, b: 0});
//=> {a: 0, b: 0, c: 0}

sortKeys({b: {b: 0, a: 0}, a: 0}, {deep: true});
//=> {a: 0, b: {a: 0, b: 0}}

sortKeys({b: [{b: 0, a: 0}], a: 0}, {deep: true});
//=> {a: 0, b: [{a: 0, b: 0}]}

sortKeys({c: 0, a: 0, b: 0}, {
	compare: (a, b) => -a.localeCompare(b)
});
//=> {c: 0, b: 0, a: 0}
```

As of v5.x, the comparator function, if given, will be bound to the current object.  It means `this` is available to access the object's values, e.g.:

```js
sortkeys({{c: 0, a: 0, b: 1}}, {
  // compare based on keys and values
  compare: function(left, right) {
      let lvalue = this[left];
      let rvalue = this[right];
      if (lvalue === rvalue) return left.localeCompare(right);
      return lvalue < rvalue;
    }
});
```
This can be used, e.g., to group all functions or objects last.  Do not use arrow function here since it would clobber `this`.

## API

### sortKeys(object, options?)

Returns a new object with sorted keys.

#### object

Type: `object`

#### options

Type: `object`

##### deep

Type: `boolean`<br>
Default: `false`

Recursively sort keys, including keys of objects inside arrays.

##### compare

Type: `Function`

[Compare function.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)


---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-sort-keys?utm_source=npm-sort-keys&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
