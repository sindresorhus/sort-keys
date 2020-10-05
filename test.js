import test from 'ava';
import sortKeys from '.';

test('sort the keys of an object', t => {
	t.deepEqual(sortKeys({c: 0, a: 0, b: 0}), {a: 0, b: 0, c: 0});
});

test('custom compare function', t => {
	const compare = (a, b) => a.localeCompare(b);
	t.deepEqual(sortKeys({c: 0, a: 0, b: 0}, {compare}), {c: 0, b: 0, a: 0});
});

test('deep option', t => {
	t.deepEqual(sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}});

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
	t.deepEqual(deepSorted.a[0], deepSorted.a[0].a.c);
	t.deepEqual(Object.keys(sorted), ['a', 'b']);
	t.deepEqual(Object.keys(deepSorted.a[0]), ['a', 'b']);
	t.deepEqual(sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0, z: [9, 8, 7, 6, 5]}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}, z: [9, 8, 7, 6, 5]});
	t.deepEqual(Object.keys(sortKeys({a: [{b: 0, a: 0}]}, {deep: true}).a[0]), ['a', 'b']);
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
