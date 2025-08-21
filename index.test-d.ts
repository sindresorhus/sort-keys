import {expectType} from 'tsd';
import sortKeys, {type Options, type SortContext} from './index.js';

// Test basic functionality
expectType<{a: 0; b: 0; c: 0}>(sortKeys({c: 0, a: 0, b: 0}));

// Test deep with boolean
expectType<{a: 0; b: {a: 0; b: 0}}>(sortKeys({b: {b: 0, a: 0}, a: 0}, {deep: true}));

// Test deep with function
expectType<{a: 0; b: {a: 0; b: 0}}>(sortKeys({b: {b: 0, a: 0}, a: 0}, {
	deep(context) {
		expectType<SortContext>(context);
		expectType<string>(context.key);
		expectType<unknown>(context.value);
		expectType<readonly string[]>(context.path);
		expectType<number>(context.depth);
		return context.depth < 3;
	},
}));

// Test ignoreKeys with array
expectType<{_private: 1; a: 0; b: 0; c: 0}>(sortKeys({
	c: 0, a: 0, _private: 1, b: 0,
}, {ignoreKeys: ['_private']}));

// Test ignoreKeys with function
expectType<{_temp: 1; a: 0; b: 0; c: 0}>(sortKeys({
	c: 0, a: 0, _temp: 1, b: 0,
}, {
	ignoreKeys(context) {
		expectType<SortContext>(context);
		return context.key.startsWith('_');
	},
}));

// Test arrays
expectType<Array<{a: 0; b: 0}>>(sortKeys([{a: 0, b: 0}, {b: 0, a: 0}], {deep: true}));

// Test custom compare
expectType<{c: 0; b: 0; a: 0}>(sortKeys(
	{c: 0, a: 0, b: 0},
	{
		compare(left, right) {
			expectType<string>(left);
			expectType<string>(right);
			return -left.localeCompare(right);
		},
	},
));

// Test options type
const options: Options = {
	deep: ({path, depth}) => depth < 3 && !path.includes('config'),
	ignoreKeys: ({key}) => key.startsWith('_'),
	compare: (a, b) => a.localeCompare(b),
};

expectType<Options>(options);
