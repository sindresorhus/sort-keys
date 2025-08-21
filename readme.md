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

sortKeys([{b: 0, a: 2}], {deep: true});
//=> [{a: 2, b: 0}]
```

## Advanced Usage with context

The `deep` and `ignoreKeys` options can receive a context object with detailed information about the current key being processed:

```js
// Ignore private keys only at root level
sortKeys(data, {
	ignoreKeys: ({key, depth}) => key.startsWith('_') && depth === 0
});

// Deep process only up to 3 levels, skip config paths
sortKeys(data, {
	deep: ({path, depth}) => depth < 3 && !path.includes('config')
});

// Complex path-based logic
sortKeys(data, {
	deep: ({path}) => !(path[0] === 'user' && path[1] === 'cache'),
	ignoreKeys: ({path, key}) => (path.length === 1 && path[0] === 'metadata') || key.startsWith('_')
});
```

## API

### sortKeys(object, options?)

Returns a new object with sorted keys.

Property descriptors are preserved, including accessors (get/set), and getters are not invoked or deep-processed. Circular references are supported and preserved.

#### object

Type: `object | Array`

When it's an object:
- Only plain objects are deeply processed.
- Only enumerable own string keys are considered; symbol and non-enumerable properties are ignored.

When it's an array:
- Array order is unchanged; holes in sparse arrays are preserved.
- Elements may be deep-processed if `deep` enables it.
- Extra enumerable properties on arrays are ignored.

#### options

Type: `object`

##### compare

Type: `Function`

[Compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) for sorting keys.

If omitted, remaining keys are sorted using the platform's default string sort.

```js
sortKeys(object, {
	compare: (a, b) => b.localeCompare(a) // Reverse alphabetical
});
```

##### deep

Type: `boolean | Function`\
Default: `false`

Recursively sort keys, including keys of objects inside arrays.

Only plain objects are sorted; other object types are left as-is. For arrays, deep processing applies to their elements.

When a boolean:
- `true`: Deep process all nested objects and arrays.
- `false`: Only sort keys at the current level.

When a function, it receives a context object and should return `true` to enable deep processing for that specific key-value pair:

```js
sortKeys(data, {
	deep: ({key, value, path, depth}) => {
		// Only deep process up to 2 levels
		if (depth >= 2) {
			return false;
		}

		// Skip deep processing of large arrays for performance
		if (Array.isArray(value) && value.length > 100) {
			return false;
		}

		// Skip config objects entirely
		if (path.includes('config')) {
			return false;
		}

		return true;
	}
});
```

##### ignoreKeys

Type: `string[] | Function`\
Default: `[]`

Keys to ignore when sorting. Ignored keys will appear first in their original order, followed by the sorted keys. Remaining keys are sorted by `compare`, or by default string sort if `compare` is not provided.

Can be an array of key names:

```js
sortKeys({c: 0, _private: 1, a: 0, b: 0}, {ignoreKeys: ['_private']});
//=> {_private: 1, a: 0, b: 0, c: 0}
```

Or a function that receives a context object:

```js
sortKeys(data, {
	ignoreKeys: ({key, value, path, depth}) => {
		// Ignore private keys at root level
		if (key.startsWith('_') && depth === 0) {
			return true;
		}

		// Ignore metadata keys in user objects
		if (path[0] === 'user' && key === 'metadata') {
			return true;
		}

		// Ignore empty objects
		if (typeof value === 'object' && Object.keys(value).length === 0) {
			return true;
		}

		return false;
	}
});
```

**Note**: `ignoreKeys` only affects the ordering of object keys; it does not control deep processing, and array indices are not sorted or filtered. To prevent deep processing of specific values, use the `deep` function option.

#### Context object

When using functions for `deep` or `ignoreKeys`, they receive a context object with:

- **`key`** (`string`): The current key being processed.
- **`value`** (`any`): The value associated with the current key.
- **`path`** (`string[]`): The full path to this key as an array of elements (for example, `['user', 'profile', 'name']`). Array indices are stringified (for example, `['items', '0', 'title']`).
- **`depth`** (`number`): The current nesting depth (0 for root level).

#### Path examples

```js
const data = {
	user: {
		profile: {
			name: 'John'
		}
	},
	items: [
		{title: 'Item 1'},
		{title: 'Item 2'}
	]
};

// Paths generated during processing (as arrays):
// ['user'] (depth: 0)
// ['user', 'profile'] (depth: 1)
// ['user', 'profile', 'name'] (depth: 2)
// ['items'] (depth: 0)
// ['items', '0'] (depth: 1)
// ['items', '0', 'title'] (depth: 2)
// ['items', '1'] (depth: 1)
// ['items', '1', 'title'] (depth: 2)
```

Note: `path` is an array of elements with stringified array indices (for example, `['items', '0', 'title']`). If your key names include dots or special characters, this representation remains unambiguous.
