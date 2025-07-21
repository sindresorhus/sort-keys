# sort-keys

> Sort the keys of an object

Useful to get a deterministically ordered object, as the order of keys can vary between engines.

## Install

```sh
npm install sort-keys
```

## Usage

```js
import sortKeys from 'sort-keys';

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

sortKeys([{b: 0, a:2}], {deep: true});
//=> [{a: 2, b: 0}]
```

## API

### sortKeys(object, options?)

Returns a new object with sorted keys.

#### object

Type: `object | Array`

#### options

Type: `object`

##### deep

Type: `boolean`\
Default: `false`

Recursively sort keys, including keys of objects inside arrays.

##### compare

Type: `Function`

[Compare function.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)

##### ignore(context)

Type: `Function`

Decide whether to skip sorting of certain options based on the result returned by ignore function.

###### context

Type: `object`

_key_

Type: `string | number`

Key of the current object or array item.

_value_

Type: `unknown`

Value of the current object or array item.

_path_

Type: `Array<string | number>`

Path to the current object or array item.

_depth_

Type: `number`

Current depth in the object or array.
