import test from 'ava';
import sortKeys from '.';

const orderedDeepEqual = (t, a, b) => {
	t.deepEqual(a, b);
	t.deepEqual(Object.keys(a), Object.keys(b));
};

const contextCompare = (a, b, object) => {
	const leftValue = object[a];
	const rightValue = object[b];

	// If values are equal, compare keys
	if (leftValue === rightValue) {
		return a.localeCompare(b);
	}

	// Else, compare values
	if (typeof rightValue !== 'number') {
		return -1;
	}

	if (typeof leftValue !== 'number') {
		return 1;
	}

	return leftValue > rightValue ? 1 : -1;
};

test('sort the keys of an object', t => {
	t.deepEqual(sortKeys({c: 0, a: 0, b: 0}), {a: 0, b: 0, c: 0});
});

test('custom compare function', t => {
	const compare = (a, b) => -a.localeCompare(b);
	orderedDeepEqual(t, sortKeys({c: 0, a: 0, b: 0}, {compare}), {c: 0, b: 0, a: 0});
});

test('custom compare function with context', t => {
	orderedDeepEqual(t, sortKeys({c: 0, a: 0, b: 1}, {compare: contextCompare}), {a: 0, c: 0, b: 1});
});

test('custom compare function with context - deep', t => {
	const fixture = {c: 0, a: {f: 2, d: 2, e: 1}, b: 1};
	const expect = {c: 0, b: 1, a: {e: 1, d: 2, f: 2}};
	const sorted = sortKeys(fixture, {compare: contextCompare, deep: true});
	orderedDeepEqual(t, sorted, expect);
	orderedDeepEqual(t, sorted.a, expect.a);
});

test('deep option', t => {
	orderedDeepEqual(t, sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}});

	t.notThrows(() => {
		const object = {a: 0};
		object.circular = object;
		sortKeys(object, {deep: true});
	});

	const object = {z: 0};
	object.circular = object;
	const sortedObject = sortKeys(object, {deep: true});

	t.is(sortedObject, sortedObject.circular);
	orderedDeepEqual(t, Object.keys(sortedObject), ['circular', 'z']);

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
	orderedDeepEqual(t, deepSorted.a[0], deepSorted.a[0].a.c);
	orderedDeepEqual(t, Object.keys(sorted), ['a', 'b']);
	orderedDeepEqual(t, Object.keys(deepSorted.a[0]), ['a', 'b']);
	orderedDeepEqual(t, sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0, z: [9, 8, 7, 6, 5]}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}, z: [9, 8, 7, 6, 5]});
	orderedDeepEqual(t, Object.keys(sortKeys({a: [{b: 0, a: 0}]}, {deep: true}).a[0]), ['a', 'b']);
});

test('deep arrays', t => {
	const object = {
		b: 0,
		a: [
			{b: 0, a: 0},
			[{b: 0, a: 0}]
		]
	};
	object.a.push(object);
	object.a[1].push(object.a[1]);

	t.notThrows(() => {
		sortKeys(object, {deep: true});
	});

	const sorted = sortKeys(object, {deep: true});
	t.is(sorted.a[2], sorted);
	t.is(sorted.a[1][1], sorted.a[1]);
	orderedDeepEqual(t, Object.keys(sorted), ['a', 'b']);
	orderedDeepEqual(t, Object.keys(sorted.a[0]), ['a', 'b']);
	orderedDeepEqual(t, Object.keys(sorted.a[1][0]), ['a', 'b']);
});
