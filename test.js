import test from 'ava';
import sortKeys from './index.js';

function deepEqualInOrder(t, actual, expected) {
	t.deepEqual(actual, expected);

	const seen = new Set();

	function assertSameKeysInOrder(object1, object2) {
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

// Original tests
test('sort the keys of an object', t => {
	deepEqualInOrder(t, sortKeys({c: 0, a: 0, b: 0}), {a: 0, b: 0, c: 0});
});

test('custom compare function', t => {
	const compare = (a, b) => b.localeCompare(a);
	deepEqualInOrder(t, sortKeys({c: 0, a: 0, b: 0}, {compare}), {c: 0, b: 0, a: 0});
});

test('deep option as boolean', t => {
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

test('top-level array preserves holes when shallow', t => {
	const array = [];
	array.length = 3; // Create holes
	array[1] = {b: 0, a: 0};

	const sorted = sortKeys(array); // Shallow copy

	// Holes preserved
	t.false(0 in sorted);
	t.true(1 in sorted);
	t.false(2 in sorted);
	// Element identity preserved
	t.is(sorted[1], array[1]);
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

// New tests for context-based API
test('ignoreKeys as array', t => {
	const object = {
		c: 0, _private: 1, a: 0, b: 0, __internal: 2,
	};
	const sorted = sortKeys(object, {ignoreKeys: ['_private', '__internal']});

	deepEqualInOrder(t, sorted, {
		_private: 1, __internal: 2, a: 0, b: 0, c: 0,
	});
});

test('ignoreKeys as function with context', t => {
	const object = {
		c: 0, _temp: 1, a: 0, $special: 2, b: 0,
	};
	const sorted = sortKeys(object, {
		ignoreKeys: ({key, depth}) => (key.startsWith('_') || key.startsWith('$')) && depth === 0,
	});

	deepEqualInOrder(t, sorted, {
		_temp: 1, $special: 2, a: 0, b: 0, c: 0,
	});
});

test('deep as function with context', t => {
	const object = {
		c: {z: 0, a: 0, b: 0},
		a: 0,
		config: {z: 0, a: 0, b: 0},
	};

	const sorted = sortKeys(object, {
		deep: ({path}) => !path.includes('config'),
	});

	deepEqualInOrder(t, sorted, {
		a: 0,
		c: {a: 0, b: 0, z: 0},
		config: {z: 0, a: 0, b: 0}, // Not deep processed
	});
});

test('depth-based deep processing', t => {
	const object = {
		c: {
			nested: {
				deep: {z: 0, a: 0},
			},
			b: 0,
			a: 0,
		},
		a: 0,
	};

	const sorted = sortKeys(object, {
		deep: ({depth}) => depth < 2, // Only process up to depth 1
	});

	deepEqualInOrder(t, sorted, {
		a: 0,
		c: {
			a: 0,
			b: 0,
			nested: {
				deep: {z: 0, a: 0}, // Not deep processed due to depth limit
			},
		},
	});
});

test('path-based ignoreKeys', t => {
	const object = {
		user: {
			metadata: {z: 0, a: 0},
			profile: {z: 0, a: 0},
		},
		c: 0,
		a: 0,
	};

	const sorted = sortKeys(object, {
		deep: true,
		ignoreKeys: ({key, path}) => key === 'metadata' && path.length === 2 && path[0] === 'user' && path[1] === 'metadata',
	});

	// Metadata key is ignored from sorting (stays in original position)
	// but its VALUE is still deep processed because deep: true
	deepEqualInOrder(t, sorted, {
		a: 0,
		c: 0,
		user: {
			metadata: {a: 0, z: 0}, // Deep processed (keys sorted)
			profile: {a: 0, z: 0}, // Deep processed (keys sorted)
		},
	});
});

test('ignoreKeys with no deep processing', t => {
	const object = {
		user: {
			metadata: {z: 0, a: 0},
			profile: {z: 0, a: 0},
		},
		c: 0,
		a: 0,
	};

	// To keep metadata contents unsorted, use deep function instead
	const sorted = sortKeys(object, {
		deep: ({path}) => !(path.length === 2 && path[0] === 'user' && path[1] === 'metadata'),
		ignoreKeys: ({key, path}) => key === 'metadata' && path.length === 2 && path[0] === 'user' && path[1] === 'metadata',
	});

	deepEqualInOrder(t, sorted, {
		a: 0,
		c: 0,
		user: {
			metadata: {z: 0, a: 0}, // NOT deep processed due to deep filter
			profile: {a: 0, z: 0}, // Deep processed
		},
	});
});

test('complex context-based processing', t => {
	const object = {
		_private: {z: 0, a: 0},
		config: {
			nested: {z: 0, a: 0},
			b: 0,
			a: 0,
		},
		data: {z: 0, a: 0},
		c: 0,
		a: 0,
	};

	const sorted = sortKeys(object, {
		deep({path, depth, key}) {
			// Don't deep process private objects or deeply nested config
			if (key.startsWith('_')) {
				return false;
			}

			if (path.length >= 2 && path[0] === 'config' && path[1] === 'nested') {
				return false;
			}

			return depth < 3;
		},
		ignoreKeys: ({key, depth}) => key.startsWith('_') && depth === 0,
	});

	deepEqualInOrder(t, sorted, {
		_private: {z: 0, a: 0}, // Ignored key AND not deep processed
		a: 0,
		c: 0,
		config: {
			a: 0,
			b: 0,
			nested: {z: 0, a: 0}, // Not deep processed due to path filter
		},
		data: {a: 0, z: 0}, // Deep processed
	});
});

test('array processing with context', t => {
	const object = {
		users: [
			{z: 0, a: 0, profile: {z: 0, a: 0}},
			{z: 0, a: 0},
		],
		b: 0,
		a: 0,
	};

	const sorted = sortKeys(object, {
		deep: ({path}) => !(path.length === 3 && path[0] === 'users' && path[1] === '0' && path[2] === 'profile'), // Skip deep processing of first user's profile
	});

	deepEqualInOrder(t, sorted, {
		a: 0,
		b: 0,
		users: [
			{a: 0, profile: {z: 0, a: 0}, z: 0}, // Profile not deep processed
			{a: 0, z: 0}, // Deep processed
		],
	});
});

test('performance: large depth with depth limit', t => {
	// Create deeply nested object
	let deep = {z: 0, a: 0};
	for (let i = 0; i < 10; i++) {
		deep = {nested: deep, z: 0, a: 0};
	}

	const object = {c: 0, data: deep, a: 0};

	const sorted = sortKeys(object, {
		deep: ({depth}) => depth < 3, // Limit depth to prevent excessive processing
	});

	t.is(typeof sorted, 'object');
	t.deepEqual(Object.keys(sorted), ['a', 'c', 'data']);
});

test('keeps property descriptors intact with context', t => {
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

	const sorted = sortKeys(object, {
		ignoreKeys: () => false, // Don't ignore any keys
	});

	deepEqualInOrder(t, sorted, {a: 2, b: 1});
	t.deepEqual(Object.getOwnPropertyDescriptors(sorted), descriptors);
});

test('mixed ignoreKeys array and function behavior', t => {
	// Test that array ignoreKeys still works with new API
	const object = {
		z: 0,
		_private: 1,
		config: {z: 0, a: 0},
		a: 0,
		__internal: 2,
	};

	const sorted = sortKeys(object, {
		deep: true,
		ignoreKeys: ['_private', '__internal'], // Array form
	});

	deepEqualInOrder(t, sorted, {
		_private: 1,
		__internal: 2,
		a: 0,
		config: {a: 0, z: 0}, // Deep processed
		z: 0,
	});
});

test('deep function with complex logic', t => {
	const object = {
		user: {
			cache: {large: Array.from({length: 1000}).fill(0).map((_, i) => ({[`key${i}`]: i}))},
			profile: {name: 'John', age: 30},
			settings: {theme: 'dark', language: 'en'},
		},
		data: {items: [{z: 0, a: 0}]},
		a: 0,
	};

	const sorted = sortKeys(object, {
		deep({path, depth, value}) {
			// Don't process cache (performance)
			if (path.includes('cache')) {
				return false;
			}

			// Don't go deeper than 3 levels
			if (depth >= 3) {
				return false;
			}

			// Don't process large arrays
			if (Array.isArray(value) && value.length > 100) {
				return false;
			}

			return true;
		},
	});

	t.deepEqual(Object.keys(sorted), ['a', 'data', 'user']);
	t.deepEqual(Object.keys(sorted.user), ['cache', 'profile', 'settings']);
	t.deepEqual(Object.keys(sorted.user.profile), ['age', 'name']);
	t.deepEqual(Object.keys(sorted.user.settings), ['language', 'theme']);

	// Cache should not be processed
	t.is(sorted.user.cache, object.user.cache);

	// Data items should be processed
	t.deepEqual(Object.keys(sorted.data.items[0]), ['a', 'z']);
});

test('context path for arrays', t => {
	const object = {
		items: [
			{z: 0, a: 0},
			{
				nested: {z: 0, a: 0},
			},
		],
	};

	const sorted = sortKeys(object, {
		deep: ({path}) => !(path.length === 3 && path[0] === 'items' && path[1] === '1' && path[2] === 'nested'), // Don't deep process nested in second item
	});

	deepEqualInOrder(t, sorted, {
		items: [
			{a: 0, z: 0}, // Deep processed
			{
				nested: {z: 0, a: 0}, // Not deep processed
			},
		],
	});
});

test('ignoreKeys with complex path matching', t => {
	const object = {
		components: {
			header: {_internal: 'value', title: 'Header', visible: true},
			footer: {_internal: 'value', text: 'Footer', visible: false},
		},
		_global: 'setting',
		config: {_internal: 'value', theme: 'dark'},
	};

	const sorted = sortKeys(object, {
		deep: true,
		ignoreKeys({key, path}) {
			// Ignore all _internal keys everywhere
			if (key === '_internal') {
				return true;
			}

			// Ignore _global at root
			if (key === '_global' && path.length === 1 && path[0] === '_global') {
				return true;
			}

			return false;
		},
	});

	deepEqualInOrder(t, sorted, {
		_global: 'setting', // Ignored at root
		components: {
			footer: {
				_internal: 'value', // Ignored
				text: 'Footer',
				visible: false,
			},
			header: {
				_internal: 'value', // Ignored
				title: 'Header',
				visible: true,
			},
		},
		config: {
			_internal: 'value', // Ignored
			theme: 'dark',
		},
	});
});

test('edge case: empty objects and arrays', t => {
	const object = {
		empty: {},
		emptyArray: [],
		c: 0,
		a: 0,
	};

	const sorted = sortKeys(object, {
		deep: true,
		ignoreKeys({value}) {
			// Check if it's an empty object or empty array
			if (Array.isArray(value)) {
				return value.length === 0;
			}

			if (typeof value === 'object' && value !== null) {
				return Object.keys(value).length === 0;
			}

			return false;
		},
	});

	// Empty and emptyArray stay in original position (ignored)
	// c and a get sorted to a, c
	deepEqualInOrder(t, sorted, {
		empty: {}, // Ignored (empty object)
		emptyArray: [], // Ignored (empty array)
		a: 0, // Sorted
		c: 0, // Sorted
	});
});

test('context validation', t => {
	const object = {b: {nested: 'value'}, a: 0};
	const contextCalls = [];

	sortKeys(object, {
		deep(context) {
			// Only track calls for object values (not primitives)
			if (typeof context.value === 'object' && context.value !== null) {
				contextCalls.push({...context});
			}

			return true;
		},
	});

	// Should have context call only for 'b' (object value)
	// 'nested' has primitive value so won't trigger deep processing
	t.is(contextCalls.length, 1);

	const bContext = contextCalls[0];
	t.is(bContext.key, 'b');
	t.deepEqual(bContext.path, ['b']);
	t.is(bContext.depth, 0);
	t.deepEqual(bContext.value, {nested: 'value'});
});

test('context validation - comprehensive', t => {
	const object = {b: {nested: 'value'}, a: 0};
	const deepCalls = [];
	const ignoreKeysCalls = [];

	sortKeys(object, {
		deep(context) {
			deepCalls.push({...context});
			return true;
		},
		ignoreKeys(context) {
			ignoreKeysCalls.push({...context});
			return false; // Don't ignore any keys
		},
	});

	// Should have deep calls for values that could be processed deeply
	// and ignoreKeys calls for all keys being sorted
	t.is(ignoreKeysCalls.length, 3); // 'b', 'a', 'nested'
	t.is(deepCalls.length, 3); // Same keys checked for deep processing

	// Verify contexts
	const bIgnore = ignoreKeysCalls.find(c => c.key === 'b');
	t.truthy(bIgnore);
	t.deepEqual(bIgnore.path, ['b']);
	t.is(bIgnore.depth, 0);

	const nestedIgnore = ignoreKeysCalls.find(c => c.key === 'nested');
	t.truthy(nestedIgnore);
	t.deepEqual(nestedIgnore.path, ['b', 'nested']);
	t.is(nestedIgnore.depth, 1);
});

test('accessor properties are preserved and sorted', t => {
	const calls = [];
	const object = {};
	Object.defineProperty(object, 'b', {
		get() {
			calls.push('b');
			return 1;
		},
		enumerable: true,
		configurable: true,
	});
	Object.defineProperty(object, 'a', {
		get() {
			calls.push('a');
			return 2;
		},
		enumerable: true,
		configurable: true,
	});

	const sorted = sortKeys(object);
	// Keys are reordered
	t.deepEqual(Object.keys(sorted), ['a', 'b']);
	// Accessors are preserved
	const descA = Object.getOwnPropertyDescriptor(sorted, 'a');
	const descB = Object.getOwnPropertyDescriptor(sorted, 'b');
	t.is(typeof descA.get, 'function');
	t.is(typeof descB.get, 'function');
	// Descriptors match originals (ignoring reorder)
	t.deepEqual({enumerable: descA.enumerable, configurable: descA.configurable}, {enumerable: true, configurable: true});
	t.deepEqual({enumerable: descB.enumerable, configurable: descB.configurable}, {enumerable: true, configurable: true});

	// Reading values still works
	t.is(sorted.a, 2);
	t.is(sorted.b, 1);
});

test('accessor properties do not throw with deep: true', t => {
	const object = {};
	Object.defineProperty(object, 'b', {
		get() {
			return {z: 0, a: 0};
		},
		enumerable: true,
		configurable: true,
	});
	Object.defineProperty(object, 'a', {
		get() {
			return {z: 0, a: 0};
		},
		enumerable: true,
		configurable: true,
	});

	t.notThrows(() => {
		sortKeys(object, {deep: true});
	});

	const sorted = sortKeys(object, {deep: true});
	// Keys reordered, accessors preserved
	t.deepEqual(Object.keys(sorted), ['a', 'b']);
	const descA = Object.getOwnPropertyDescriptor(sorted, 'a');
	const descB = Object.getOwnPropertyDescriptor(sorted, 'b');
	t.is(typeof descA.get, 'function');
	t.is(typeof descB.get, 'function');
});

test('sparse arrays: preserve holes and sort nested objects', t => {
	const array = [];
	array.length = 4; // Create holes
	array[1] = {b: 0, a: 0};
	array[3] = {d: 0, c: 0};

	const sorted = sortKeys(array, {deep: true});

	// Length preserved
	t.is(sorted.length, 4);
	// Holes preserved
	t.false(0 in sorted);
	t.true(1 in sorted);
	t.false(2 in sorted);
	t.true(3 in sorted);
	// Nested objects sorted
	t.deepEqual(Object.keys(sorted[1]), ['a', 'b']);
	t.deepEqual(Object.keys(sorted[3]), ['c', 'd']);
});

test('array extra enumerable properties are not copied', t => {
	const array = [{b: 0, a: 0}];
	// Add an extra enumerable prop to array instance
	array.foo = 'bar';

	const sorted = sortKeys(array, {deep: true});

	// Element deep-processed
	t.deepEqual(Object.keys(sorted[0]), ['a', 'b']);
	// Extra property not copied to result array
	t.false(Object.hasOwn(sorted, 'foo'));
});

test('Object.create(null) handling', t => {
	const object = Object.create(null);
	object.c = 0;
	object.a = 0;
	object.b = 0;

	const sorted = sortKeys(object);
	// Implementation currently relies on is-plain-obj to determine plainness.
	// If treated as plain, keys should be sorted; otherwise, unchanged.
	const keys = Object.keys(sorted);
	const eitherSortedOrOriginal = (keys.join(',') === 'a,b,c')
		|| (keys.join(',') === 'c,a,b');
	t.true(eitherSortedOrOriginal);
});

test('non-plain objects are not deep-processed', t => {
	const date = new Date();
	const map = new Map([['z', 0], ['a', 0]]);
	const object = {
		b: {z: 0, a: 0},
		a: 0,
		date,
		map,
	};

	const sorted = sortKeys(object, {deep: true});

	// Keys sorted at root and nested plain objects
	t.deepEqual(Object.keys(sorted), ['a', 'b', 'date', 'map']);
	t.deepEqual(Object.keys(sorted.b), ['a', 'z']);

	// Non-plain instances are copied by reference
	t.is(sorted.date, date);
	t.is(sorted.map, map);
});

test('non-enumerable keys are not copied and symbol keys are not copied', t => {
	const sym = Symbol('s');
	const object = {};
	Object.defineProperty(object, 'hidden', {value: 1, enumerable: false});
	object.a = 0;
	object[sym] = 2;

	const sorted = sortKeys(object);

	// Only enumerable string keys present
	t.deepEqual(Object.keys(sorted), ['a']);
	// Non-enumerable absent
	t.false(Object.prototype.propertyIsEnumerable.call(sorted, 'hidden'));
	// Symbol not copied
	t.false(Object.getOwnPropertySymbols(sorted).includes(sym));
});

test('throws on invalid input', t => {
	t.throws(() => sortKeys(123), {instanceOf: TypeError});
	t.throws(() => sortKeys(null), {instanceOf: TypeError});
	t.throws(() => sortKeys(new Map()), {instanceOf: TypeError});
});

test('stable sort: comparator returning 0 preserves original order', t => {
	const object = {
		b: 0,
		a: 0,
		c: 0,
		d: 0,
	};
	const keepOrder = () => 0;
	const sorted = sortKeys(object, {compare: keepOrder});
	// Order should be original since sort is stable in Node 20+
	t.deepEqual(Object.keys(sorted), ['b', 'a', 'c', 'd']);
});

test('keys containing dots are treated as opaque path elements', t => {
	const object = {
		'a.b': {z: 0, a: 0},
		a: 0,
	};

	const sorted = sortKeys(object, {
		deep: ({path}) => path[0] === 'a.b',
	});

	deepEqualInOrder(t, sorted, {
		a: 0,
		'a.b': {a: 0, z: 0},
	});
});

test('non-plain objects (custom prototype) are invalid input', t => {
	const proto = {inherited: 1};
	const object = Object.create(proto);
	object.b = 0;
	object.a = 0;

	t.throws(() => sortKeys(object), {instanceOf: TypeError});
});

test('aliasing is preserved for duplicate references', t => {
	const shared = {z: 0, a: 0};
	const object = {left: shared, right: shared};
	const sorted = sortKeys(object, {deep: true});

	// Both references should point to the same new object
	t.is(sorted.left, sorted.right);
	// And that object should be sorted
	deepEqualInOrder(t, sorted.left, {a: 0, z: 0});
});

test('deep function can selectively skip odd array indices', t => {
	const object = {
		items: [
			{z: 0, a: 0},
			{z: 0, a: 0},
			{z: 0, a: 0},
		],
	};

	const sorted = sortKeys(object, {
		deep: ({path}) => !(path[0] === 'items' && Number.isInteger(Number(path[1])) && Number(path[1]) % 2 === 1),
	});

	// Index 0 and 2 deep-processed, index 1 left as-is
	t.deepEqual(Object.keys(sorted.items[0]), ['a', 'z']);
	t.deepEqual(Object.keys(sorted.items[1]), ['z', 'a']);
	t.deepEqual(Object.keys(sorted.items[2]), ['a', 'z']);
});

test('accessor getter value is not deep-processed', t => {
	const object = {};
	Object.defineProperty(object, 'a', {
		get() {
			return {z: 0, a: 0};
		},
		enumerable: true,
		configurable: true,
	});
	Object.defineProperty(object, 'b', {
		value: 1,
		enumerable: true,
		configurable: true,
		writable: true,
	});

	const sorted = sortKeys(object, {deep: true});
	// Read the getter and verify its returned object is not sorted
	t.deepEqual(Object.keys(sorted.a), ['z', 'a']);
});

test('idempotence: sorting twice yields identical result', t => {
	const input = {c: {z: 0, a: 0}, b: 0, a: [{d: 0, c: 0}, {b: 0, a: 0}]};
	const once = sortKeys(input, {deep: true});
	const twice = sortKeys(once, {deep: true});
	deepEqualInOrder(t, twice, once);
});

test('ignored keys keep original order before sorted keys', t => {
	const input = {
		c: 0,
		x: 1,
		a: 0,
		y: 2,
		b: 0,
	};
	const sorted = sortKeys(input, {
		ignoreKeys: ['x', 'y'],
		compare: (l, r) => l.localeCompare(r),
	});
	deepEqualInOrder(t, sorted, {
		x: 1,
		y: 2,
		a: 0,
		b: 0,
		c: 0,
	});
});

test('depth semantics for arrays and objects in deep function', t => {
	const calls = [];
	const input = {
		root: {
			obj: {x: 0},
			arr: [{y: 0}],
		},
	};
	sortKeys(input, {
		deep(context) {
			calls.push({
				path: context.path,
				depth: context.depth,
				isArray: Array.isArray(context.value),
			});
			return true;
		},
	});

	const find = p => calls.find(c => JSON.stringify(c.path) === JSON.stringify(p));
	// Root
	t.truthy(find(['root']));
	t.is(find(['root']).depth, 0);
	// Root.obj
	t.truthy(find(['root', 'obj']));
	t.is(find(['root', 'obj']).depth, 1);
	// Root.arr (array at depth 1)
	t.truthy(find(['root', 'arr']));
	t.is(find(['root', 'arr']).depth, 1);
	// Root.arr.0 (array item increases depth)
	t.truthy(find(['root', 'arr', '0']));
	t.is(find(['root', 'arr', '0']).depth, 2);
});
