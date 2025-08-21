/**
Context information passed to filter functions.
*/
export type SortContext = {
	/**
	The current key being processed.
	*/
	readonly key: string;

	/**
	The value associated with the current key
	*/
	readonly value: unknown;

	/**
	The full path to this key as an array of path elements (for example, `['user', 'profile', 'name']`).

	Array indices are stringified (for example, `['items', '0', 'title']`).

	Examples of generated paths (with depths):
	- ['user'] (depth: 0)
	- ['user', 'profile'] (depth: 1)
	- ['user', 'profile', 'name'] (depth: 2)
	- ['items'] (depth: 0)
	- ['items', '0'] (depth: 1)
	- ['items', '0', 'title'] (depth: 2)
	- ['items', '1'] (depth: 1)
	- ['items', '1', 'title'] (depth: 2)
	*/
	readonly path: readonly string[];

	/**
	The current nesting depth (0 for root level).
	*/
	readonly depth: number;
};

export type Options = {
	/**
	Compare function for sorting keys.

	@see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort

	If omitted, remaining keys are sorted using the platform's default string sort.
	*/
	readonly compare?: (left: string, right: string) => number;

	/**
	Recursively sort keys, including keys of objects inside arrays.

	@default false

	Only plain objects are sorted; other object types are left as-is. For arrays, deep processing applies to their elements.

	When a boolean:
	- `true`: Deep process all nested objects and arrays.
	- `false`: Only sort keys at the current level.

	When a function, it receives a context object and should return `true` to enable deep processing for that specific key-value pair.
	The context is `SortContext` with `{ key, value, path, depth }`.

	@example
	```
	// Fine-grained deep control with context
	sortKeys(data, {
		deep: ({key, value, path, depth}) => {
			// Only deep process up to 2 levels
			if (depth >= 2) {
				return false;
			}

			// Skip deep processing of large arrays for performance
			if (Array.isArray(value) && (value as any[]).length > 100) {
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
	*/
	readonly deep?: boolean | ((context: SortContext) => boolean);

	/**
	Keys to ignore during sorting. Ignored keys appear first in their original order, followed by the sorted keys. Remaining keys are sorted by `compare`, or by default string sort if `compare` is not provided.

	@default []

	Only affects the ordering of object keys; it does not control deep processing, and array indices are not sorted or filtered.

	Can be an array of key names, or a function that receives context and returns true to ignore the key.

	@example
	```
	// Ignore by name; ignored keys keep original order and appear first
	sortKeys({c: 0, _private: 1, a: 0, b: 0}, {ignoreKeys: ['_private']});
	//=> {_private: 1, a: 0, b: 0, c: 0}

	// Ignore by function with multiple conditions
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
			if (typeof value === 'object' && Object.keys(value as any).length === 0) {
				return true;
			}

			return false;
		}
	});
	```
	*/
	readonly ignoreKeys?: readonly string[] | ((context: SortContext) => boolean);
};

/**
Sort the keys of an object.

@param object - The object or array to sort.
@returns A new object with sorted keys.

Property descriptors are preserved, including accessors (get/set); getters are not invoked or deep-processed. Circular references are supported and preserved.

When it's an object:
- Only plain objects are deeply processed.
- Only enumerable own string keys are considered; symbol and non-enumerable properties are ignored.

When it's an array:
- Array order is unchanged; holes in sparse arrays are preserved.
- Elements may be deep-processed if `deep` enables it.
- Extra enumerable properties on arrays are ignored.

@example
import sortKeys from 'sort-keys';

// Basic usage
sortKeys({c: 0, a: 0, b: 0});
//=> {a: 0, b: 0, c: 0}

// Deep sorting of nested objects
sortKeys({b: {b: 0, a: 0}, a: 0}, {deep: true});
//=> {a: 0, b: {a: 0, b: 0}}

// Deep sorting of objects inside arrays
sortKeys({b: [{b: 0, a: 0}], a: 0}, {deep: true});
//=> {a: 0, b: [{a: 0, b: 0}]}

// Custom key compare (reverse alphabetical)
sortKeys({c: 0, a: 0, b: 0}, {
	compare: (a, b) => -a.localeCompare(b)
});
//=> {c: 0, b: 0, a: 0}

// Deep processing for a top-level array
sortKeys([{b: 0, a: 2}], {deep: true});
//=> [{a: 2, b: 0}]
*/
export default function sortKeys<T extends Record<string, any>>(
	object: T,
	options?: Options
): T;
export default function sortKeys<T>(
	object: T[],
	options?: Options
): T[];
