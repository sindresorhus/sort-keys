import {expectType} from 'tsd';
import sortKeys = require('.');

const options: sortKeys.Options = {};

expectType<{a: 0; b: 0; c: 0}>(sortKeys({c: 0, a: 0, b: 0}));
expectType<{a: 0; b: {a: 0; b: 0}}>(
	sortKeys({b: {b: 0, a: 0}, a: 0}, {deep: true})
);
expectType<{c: 0; b: 0; a: 0}>(
	sortKeys(
		{c: 0, a: 0, b: 0},
		{
			compare: (left, right) => {
				expectType<string>(left);
				expectType<string>(right);

				return -left.localeCompare(right);
			}
		}
	)
);
