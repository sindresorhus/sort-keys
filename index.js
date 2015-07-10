'use strict';
module.exports = function (obj, compareFn) {
	if (typeof obj !== 'object') {
		throw new TypeError('Expected an object');
	}

	var ret = {};
	var keys = Object.keys(obj).sort(compareFn);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		ret[key] = obj[key];
	}

	return ret;
};
