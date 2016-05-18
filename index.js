'use strict';
var isPlainObj = require('is-plain-obj');

module.exports = function (obj, opts) {
	if (!isPlainObj(obj)) {
		throw new TypeError('Expected a plain object');
	}

	opts = opts || {};

	// DEPRECATED
	if (typeof opts === 'function') {
		opts = {compare: opts};
	}

	var deep = opts.deep;

	var inputList = [];
	var outputList = [];

	var sortKeys = function (x) {
		var index = inputList.indexOf(x);
		if (index > -1) {
			return outputList[index];
		}

		var ret = {};
		var keys = Object.keys(x).sort(opts.compare);

		inputList.push(x);
		outputList.push(ret);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var val = x[key];

			ret[key] = deep && isPlainObj(val) ? sortKeys(val) : val;
		}

		return ret;
	};

	return sortKeys(obj);
};
