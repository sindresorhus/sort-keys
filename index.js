'use strict';
const isPlainObj = require('is-plain-obj');

module.exports = (obj, opts) => {
	if (!isPlainObj(obj)) {
		throw new TypeError('Expected a plain object');
	}

	opts = opts || {};

	const deep = opts.deep;
	const seenInput = [];
	const seenOutput = [];

	const sortKeys = x => {
		const seenIndex = seenInput.indexOf(x);

		if (seenIndex !== -1) {
			return seenOutput[seenIndex];
		}

		const ret = {};
		const keys = Object.keys(x).sort(opts.compare);

		seenInput.push(x);
		seenOutput.push(ret);

		for (const key of keys) {
			const val = x[key];

			if (deep && Array.isArray(val)) {
				ret[key] = val.map(y => isPlainObj(y) ? sortKeys(y) : y);
				continue;
			}

			ret[key] = deep && isPlainObj(val) ? sortKeys(val) : val;
		}

		return ret;
	};

	return sortKeys(obj);
};
