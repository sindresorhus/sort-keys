'use strict';
var assert = require('assert');
var sortKeys = require('./');

it('should sort the keys of an object', function () {
	assert.strictEqual(
		JSON.stringify(sortKeys({c: 0, a: 0, b: 0})),
		JSON.stringify({a: 0, b: 0, c: 0})
	);
});

it('DEPRECATED - should sort the keys of an object with a custom sort function', function () {
	var sortFn = function (a, b) {
		return -a.localeCompare(b);
	};

	assert.strictEqual(
		JSON.stringify(sortKeys({c: 0, a: 0, b: 0}, sortFn)),
		JSON.stringify({c: 0, b: 0, a: 0})
	);
});

it('custom compare function', function () {
	var compare = function (a, b) {
		return -a.localeCompare(b);
	};

	assert.strictEqual(
		JSON.stringify(sortKeys({c: 0, a: 0, b: 0}, {compare: compare})),
		JSON.stringify({c: 0, b: 0, a: 0})
	);
});

it('deep option', function () {
	assert.strictEqual(
		JSON.stringify(sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0}, {deep: true})),
		JSON.stringify({a: 0, b: 0, c: {a: 0, b: 0, c: 0}})
	);

	assert.doesNotThrow(function () {
		var obj = {a: 0};
		obj.circular = obj;
		sortKeys(obj, {deep: true});
	});

	assert.strictEqual(
		JSON.stringify(sortKeys({c: {c: 0, a: 0, b: 0}, a: 0, b: 0, z: [9, 8, 7, 6, 5]}, {deep: true})),
		JSON.stringify({a: 0, b: 0, c: {a: 0, b: 0, c: 0}, z: [9, 8, 7, 6, 5]})
	);
});
