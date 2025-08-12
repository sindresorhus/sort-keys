
export type IgnoreContext = {
	/** Key of the current object or array item. */
	key: string | number | undefined;
	/** Value of the current object or array item. */
	value: unknown;
	/** Path to the current object or array item. */
	path: Array<string | number>;
	/** Current depth in the object or array. */
	depth: number;
};

export type Options = {
	/**
	Recursively sort keys, including keys of objects inside arrays.

	@default false
	*/
	readonly deep?: boolean;

	/**
	[Compare function.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
	*/
	readonly compare?: (left: string, right: string) => number;

	/**
	Decide whether to skip sorting of certain options based on the result returned by ignore function. This only applies when `deep` is set to `true`.
	*/
	readonly ignore?: (context: IgnoreContext) => boolean;
};

/**
Sort the keys of an object.

@returns A new object with sorted keys.

@example
```
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
*/
export default function sortKeys<T extends Record<string, any>>(
	object: T,
	options?: Options
): T;
export default function sortKeys<T>(
	object: T[],
	options?: Options
): T[];
