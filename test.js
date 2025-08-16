import test from 'ava';
import sortKeys from './index.js';

function deepEqualInOrder(t, actual, expected) {
	t.deepEqual(actual, expected);

	const seen = new Set();

	function assertSameKeysInOrder(object1, object2) {
		// This function assumes the objects given are already deep equal.

		if (seen.has(object1) && seen.has(object2)) {
			return;
		}

		seen.add(object1);
		seen.add(object2);

		if (Array.isArray(object1)) {
			for (const index of object1.keys()) {
				assertSameKeysInOrder(object1[index], object2[index]);
			}
		} else if (typeof object1 === 'object') {
			const keys1 = Object.keys(object1);
			const keys2 = Object.keys(object2);
			t.deepEqual(keys1, keys2);
			for (const index of keys1.keys()) {
				assertSameKeysInOrder(object1[keys1[index]], object2[keys2[index]]);
			}
		}
	}

	assertSameKeysInOrder(actual, expected);
}

test('sort the keys of an object', t => {
	deepEqualInOrder(t, sortKeys({c: 0, a: 0, b: 0}), {a: 0, b: 0, c: 0});
});

test('custom compare function', t => {
	const compare = (a, b) => b.localeCompare(a);
	deepEqualInOrder(t, sortKeys({c: 0, a: 0, b: 0}, {compare}), {c: 0, b: 0, a: 0});
});

test('deep option', t => {
	deepEqualInOrder(t, sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}});

	t.notThrows(() => {
		const object = {a: 0};
		object.circular = object;
		sortKeys(object, {deep: true});
	});

	const object = {z: 0};
	object.circular = object;
	const sortedObject = sortKeys(object, {deep: true});

	t.is(sortedObject, sortedObject.circular);
	t.deepEqual(Object.keys(sortedObject), ['circular', 'z']);

	const object1 = {b: 0};
	const object2 = {d: 0};
	const object3 = {a: [{b: 0}]};
	const object4 = {a: [{d: 0}]};

	object1.a = object2;
	object2.c = object1;
	object3.a[0].a = object4.a[0];
	object4.a[0].c = object3.a[0];

	t.notThrows(() => {
		sortKeys(object1, {deep: true});
		sortKeys(object2, {deep: true});
		sortKeys(object3, {deep: true});
		sortKeys(object4, {deep: true});
	});

	const sorted = sortKeys(object1, {deep: true});
	const deepSorted = sortKeys(object3, {deep: true});

	t.is(sorted, sorted.a.c);
	deepEqualInOrder(t, deepSorted.a[0], deepSorted.a[0].a.c);
	t.deepEqual(Object.keys(sorted), ['a', 'b']);
	t.deepEqual(Object.keys(deepSorted.a[0]), ['a', 'b']);
	deepEqualInOrder(t, sortKeys({
		c: {c: 0, a: 0, b: 0}, a: 0, b: 0, z: [9, 8, 7, 6, 5],
	}, {deep: true}), {
		a: 0, b: 0, c: {a: 0, b: 0, c: 0}, z: [9, 8, 7, 6, 5],
	});
	t.deepEqual(Object.keys(sortKeys({a: [{b: 0, a: 0}]}, {deep: true}).a[0]), ['a', 'b']);
});

test('deep arrays', t => {
	const object = {
		b: 0,
		a: [
			{b: 0, a: 0},
			[{b: 0, a: 0}],
		],
	};
	object.a.push(object);
	object.a[1].push(object.a[1]);

	t.notThrows(() => {
		sortKeys(object, {deep: true});
	});

	const sorted = sortKeys(object, {deep: true});
	t.is(sorted.a[2], sorted);
	t.is(sorted.a[1][1], sorted.a[1]);
	t.deepEqual(Object.keys(sorted), ['a', 'b']);
	t.deepEqual(Object.keys(sorted.a[0]), ['a', 'b']);
	t.deepEqual(Object.keys(sorted.a[1][0]), ['a', 'b']);
});

test('top-level array', t => {
	const array = [{b: 0, a: 0}, {c: 0, d: 0}];
	const sorted = sortKeys(array);
	t.not(sorted, array, 'should make a copy');
	t.is(sorted[0], array[0]);
	t.is(sorted[1], array[1]);

	const deepSorted = sortKeys(array, {deep: true});
	t.not(deepSorted, array);
	t.not(deepSorted[0], array[0]);
	t.not(deepSorted[1], array[1]);
	t.deepEqual(Object.keys(deepSorted[0]), ['a', 'b']);
	t.deepEqual(Object.keys(deepSorted[1]), ['c', 'd']);
});

test('keeps property descriptors intact', t => {
	const descriptors = {
		b: {
			value: 1,
			configurable: true,
			enumerable: true,
			writable: false,
		},
		a: {
			value: 2,
			configurable: false,
			enumerable: true,
			writable: true,
		},
	};

	const object = {};
	Object.defineProperties(object, descriptors);

	const sorted = sortKeys(object);

	deepEqualInOrder(t, sorted, {a: 2, b: 1});
	t.deepEqual(Object.getOwnPropertyDescriptors(sorted), descriptors);
});

test('with ignore option', t => {
	const object = {
		b: 0,
		c: {
			d: {
				e: 0,
				a: 0,
			},
			b: 0,
		},
	};
	const sorted = sortKeys(object, {ignore: ({depth}) => depth >= 2, deep: true});
	t.deepEqual(Object.keys(sorted), ['b', 'c']);
	t.deepEqual(Object.keys(sorted.c), ['d', 'b']);
	t.deepEqual(Object.keys(sorted.c.d), ['e', 'a']);
});

test('with ignore option ignore key', t => {
	const object = {
		b: 0,
		c: {
			f: {
				d: 0,
				a: 0,
			},
			e: {
				h: 0,
				g: 0,
			},
		},
		a: 0,
	};
	const sorted = sortKeys(object, {
		ignore: ({key}) => key === 'e',
		deep: true,
	});
	t.deepEqual(Object.keys(sorted), ['a', 'b', 'c']);
	t.deepEqual(Object.keys(sorted.c), ['e', 'f']);
	t.deepEqual(Object.keys(sorted.c.f), ['a', 'd']);
	t.deepEqual(Object.keys(sorted.c.e), ['h', 'g']);
});

test('with ignore option: ignore sorting for nested objects beyond a certain depth', t => {
	const input = {
		c: {
			b: {
				e: 3,
				d: 2,
				f: 4,
			},
			a: {
				g: 5,
				h: 6,
			},
		},
		b: {
			z: 7,
			y: 8,
		},
		a: 1,
	};
	const result = sortKeys(input, {
		ignore: ({depth}) => depth > 1,
		deep: true,
	});
	// Only top-level object should be sorted
	t.deepEqual(Object.keys(result), ['a', 'b', 'c']);
	t.deepEqual(Object.keys(result.c), ['b', 'a']);
	t.deepEqual(Object.keys(result.b), ['z', 'y']);
});

test('with ignore option: ignore sorting for keys matching specific criteria', t => {
	const input = {
		foo: {
			bar: {
				baz: 0,
				qux: 0,
			},
			bat: {
				baz: 1,
				qux: 1,
			},
		},
		quux: {
			corge: 2,
			grault: 3,
		},
		garply: 4,
	};
	const result = sortKeys(input, {
		ignore: ({key}) => key === 'bar',
		deep: true,
	});
	// Top-level keys are sorted normally
	t.deepEqual(Object.keys(result), ['foo', 'garply', 'quux']);
	// Inside 'foo', the branch for 'bar' remains unsorted
	t.deepEqual(Object.keys(result.foo), ['bar', 'bat']);
	// Other nested objects are sorted
	t.deepEqual(Object.keys(result.quux), ['corge', 'grault']);
});

test('with ignore option: combining key and depth conditions', t => {
	const input = {
		a: 0,
		b: {
			unsorted: {
				y: 2,
				x: 1,
			},
			sorted: {
				d: 4,
				c: 3,
			},
		},
		c: 3,
	};
	const result = sortKeys(input, {
		ignore: ({key, depth}) => depth === 2 && key === 'unsorted',
		deep: true,
	});
	// Top-level keys are sorted
	t.deepEqual(Object.keys(result), ['a', 'b', 'c']);
	// In object 'b', the unaffected branch 'sorted' is sorted while 'unsorted' stays in its original order
	t.deepEqual(Object.keys(result.b), ['sorted', 'unsorted']);
	t.deepEqual(Object.keys(result.b.sorted), ['c', 'd']);
	t.deepEqual(Object.keys(result.b.unsorted), ['y', 'x']);
});

test('with ignore option: skip sorting array property', t => {
	const input = {
		arr: [
			{
				b: 0,
				a: 1,
			},
			{
				d: 0,
				c: 1,
			},
		],
		obj: {
			d: 0,
			c: 1,
		},
	};

	const sorted = sortKeys(input, {
		deep: true,
		ignore: ({key}) => key === 'arr',
	});

	// Top-level keys are sorted in ascending order
	t.deepEqual(Object.keys(sorted), ['arr', 'obj']);

	// The array under the "arr" key is not sorted, so each element keeps its original order
	t.deepEqual(Object.keys(sorted.arr[0]), ['b', 'a']);
	t.deepEqual(Object.keys(sorted.arr[1]), ['d', 'c']);

	// The "obj" property is deeply sorted
	t.deepEqual(Object.keys(sorted.obj), ['c', 'd']);
});

test('ignore: accessor property is preserved (no invalid descriptor)', t => {
	const input = {};
	let getCalls = 0;
	Object.defineProperty(input, 'foo', {
		get() {
			getCalls++;
			return 123;
		},
		enumerable: true,
		configurable: true,
	});
	Object.defineProperty(input, 'bar', {
		value: 1,
		writable: true,
		enumerable: true,
		configurable: true,
	});

	const output = sortKeys(input, {
		deep: true,
		ignore: ({key}) => key === 'foo',
	});

	const desc = Object.getOwnPropertyDescriptor(output, 'foo');
	t.truthy(desc);
	t.is(typeof desc.get, 'function');
	t.false('value' in desc);
	t.is(output.foo, 123);
	t.true(getCalls >= 1);
});

test('ignore: array sibling path does not leak (only first item ignored)', t => {
	const input = [
		{b: 1, a: 2},
		{b: 1, a: 2},
	];

	const output = sortKeys(input, {
		deep: true,
		ignore: ({key, path}) => typeof key === 'number' && key === 0 && path.length === 1,
	});

	// First element kept as-is (unsorted)
	t.deepEqual(Object.keys(output[0]), ['b', 'a']);

	// Second element should still be deeply sorted
	t.deepEqual(Object.keys(output[1]), ['a', 'b']);
});

test('ignore: object-level sentinel preserves current object order, but still deep-sorts children', t => {
	const input = {
		b: {y: 0, x: 0},
		a: {y: 0, x: 0},
	};

	const output = sortKeys(input, {
		deep: true,
		ignore: ({key, path}) => key === undefined && path.length === 0,
	});

	// Top-level order preserved
	t.deepEqual(Object.keys(output), ['b', 'a']);

	// Children still sorted
	t.deepEqual(Object.keys(output.b), ['x', 'y']);
	t.deepEqual(Object.keys(output.a), ['x', 'y']);
});

test('ignore: depth targeting for object-level sort (skip sorting at depth 3 only)', t => {
	const input = {
		a: {
			b: {d: 1, c: 1},
			z: 1,
		},
	};

	const output = sortKeys(input, {
		deep: true,
		ignore: ({key, depth}) => key === undefined && depth === 3,
	});

	// Depth-3 object kept in original order
	t.deepEqual(Object.keys(output.a.b), ['d', 'c']);

	// Other levels can still be sorted where applicable
	t.deepEqual(Object.keys(output), ['a']);
	t.deepEqual(Object.keys(output.a), ['b', 'z']);
});

test('accessor property is preserved when not ignored', t => {
	const input = {};
	Object.defineProperty(input, 'foo', {
		get() {
			return 123;
		},
		enumerable: true,
		configurable: true,
	});
	const output = sortKeys(input, {deep: true});
	const desc = Object.getOwnPropertyDescriptor(output, 'foo');
	t.truthy(desc);
	t.is(typeof desc.get, 'function');
	t.false('value' in desc);
	t.is(output.foo, 123);
});
