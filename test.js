import test from 'ava';
import m from './';

test('sort the keys of an object', t => {
	t.deepEqual(m({c: 0, a: 0, b: 0}), {a: 0, b: 0, c: 0});
});

test('DEPRECATED - sort the keys of an object with a custom sort function', t => {
	const sortFn = (a, b) => -a.localeCompare(b);
	t.deepEqual(m({c: 0, a: 0, b: 0}, sortFn), {c: 0, b: 0, a: 0});
});

test('custom compare function', t => {
	const compare = (a, b) => a.localeCompare(b);
	t.deepEqual(m({c: 0, a: 0, b: 0}, {compare}), {c: 0, b: 0, a: 0});
});

test('deep option', t => {
	t.deepEqual(m({c: {c: 0, a: 0, b: 0}, a: 0, b: 0}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}});

	t.notThrows(() => {
		const obj = {a: 0};
		obj.circular = obj;
		m(obj, {deep: true});
	});

	const obj = {z: 0};
	obj.circular = obj;
	const sortedObj = m(obj, {deep: true});

	t.is(sortedObj, sortedObj.circular);
	t.deepEqual(Object.keys(sortedObj), ['circular', 'z']);

	const obj1 = {b: 0};
	const obj2 = {d: 0};

	obj1.a = obj2;
	obj2.c = obj1;

	t.notThrows(() => {
		m(obj1, {deep: true});
		m(obj2, {deep: true});
	});

	const sorted = m(obj1, {deep: true});

	t.is(sorted, sorted.a.c);
	t.deepEqual(Object.keys(sorted), ['a', 'b']);
	t.deepEqual(m({c: {c: 0, a: 0, b: 0}, a: 0, b: 0, z: [9, 8, 7, 6, 5]}, {deep: true}), {a: 0, b: 0, c: {a: 0, b: 0, c: 0}, z: [9, 8, 7, 6, 5]});
});
