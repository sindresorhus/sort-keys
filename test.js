'use strict';
var assert = require('assert');
var sortKeys = require('./');

it('should sort the keys of an object', function () {
	assert.strictEqual(
		JSON.stringify(sortKeys({c: 0, a: 0, b: 0})),
		JSON.stringify({a: 0, b: 0, c: 0})
	);
});

it('should sort the keys of an object with a custom sort function', function () {
	var sortFn = function (a, b) {
		return -a.localeCompare(b);
	};

	assert.strictEqual(
		JSON.stringify(sortKeys({c: 0, a: 0, b: 0}, sortFn)),
		JSON.stringify({c: 0, b: 0, a: 0})
	);
});
