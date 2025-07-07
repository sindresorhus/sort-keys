
export type IgnoreContext = {
	key: string | number;
	value: unknown;
	path: Array<string | number>;
	depth: number;
};

export type Options = {
	/**
	Recursively sort keys, including keys of objects inside arrays.

	@default false
	*/
	readonly deep?: boolean | number;

	/**
	[Compare function.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
	*/
	readonly compare?: (left: string, right: string) => number;

	/**
	 * Ignore fields that meet certain conditions to avoid sorting.
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
