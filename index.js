'use strict';
module.exports = function (obj, compareFn) {
	if (typeof obj !== 'object') {
		throw new TypeError('Expected an object');
	}

	var ret = {};

	Object.keys(obj).sort(compareFn).forEach(function (el) {
		ret[el] = obj[el];
	});

	return ret;
};
