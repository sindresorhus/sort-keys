'use strict';
var isObj = require('is-obj');

module.exports = function (obj, opts) {
	if (!isObj(obj)) {
		throw new TypeError('Expected an object');
	}

	opts = opts || {};

	// DEPRECATED
	if (typeof opts === 'function') {
		opts = {compare: opts};
	}

	var deep = opts.deep;

	var sortKeys = function (x) {
		var ret = {};
		var keys = Object.keys(x).sort(opts.compare);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var val = x[key];

			ret[key] = deep && val !== x && isObj(val) ? sortKeys(val) : val;
		}

		return ret;
	};

	return sortKeys(obj);
};
