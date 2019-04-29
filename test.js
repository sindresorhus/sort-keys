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
		const obj = {a: 0};
		obj.circular = obj;
		sortKeys(obj, {deep: true});
	});

	const obj = {z: 0};
	obj.circular = obj;
	const sortedObj = sortKeys(obj, {deep: true});

	t.is(sortedObj, sortedObj.circular);
	t.deepEqual(Object.keys(sortedObj), ['circular', 'z']);

	const obj1 = {b: 0};
	const obj2 = {d: 0};
	const obj3 = {a: [{b: 0}]};
	const obj4 = {a: [{d: 0}]};

	obj1.a = obj2;
	obj2.c = obj1;
	obj3.a[0].a = obj4.a[0];
	obj4.a[0].c = obj3.a[0];

	t.notThrows(() => {
		sortKeys(obj1, {deep: true});
		sortKeys(obj2, {deep: true});
		sortKeys(obj3, {deep: true});
		sortKeys(obj4, {deep: true});
	});

	const sorted = sortKeys(obj1, {deep: true});
	const deepSorted = sortKeys(obj3, {deep: true});

	t.is(sorted, sorted.a.c);
	t.deepEqual(deepSorted.a[0], deepSorted.a[0].a.c);
	t.deepEqual(Object.keys(sorted), ['a', 'b']);
	t.deepEqual(Object.keys(deepSorted.a[0]), ['a', 'b']);
	t.deepEqual(sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0, z: [9, 8, 7, 6, 5]}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}, z: [9, 8, 7, 6, 5]});
	t.deepEqual(Object.keys(sortKeys({a: [{b: 0, a: 0}]}, {deep: true}).a[0]), ['a', 'b']);
});
