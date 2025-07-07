import isPlainObject from 'is-plain-obj';

export default function sortKeys(object, options = {}) {
	if (!isPlainObject(object) && !Array.isArray(object)) {
		throw new TypeError('Expected a plain object or array');
	}

	const {deep, compare, ignore} = options;
	const cache = new WeakMap();

	const deepSortArray = (array, path = []) => {
		const resultFromCache = cache.get(array);
		if (resultFromCache !== undefined) {
			return resultFromCache;
		}

		const result = [];
		cache.set(array, result);

		result.push(...array.map((item, index) => {
			path.push(index);

			if (deep && ignore && ignore(
				{
					key: index,
					value: item,
					path,
					depth: path.length,
				})) {
				path.pop();
				return item;
			}

			if (Array.isArray(item)) {
				return deepSortArray(item, path);
			}

			if (isPlainObject(item)) {
				return _sortKeys(item, path);
			}

			path.pop();

			return item;
		}));

		return result;
	};

	const _sortKeys = (object, path = []) => {
		const resultFromCache = cache.get(object);
		if (resultFromCache !== undefined) {
			return resultFromCache;
		}

		const result = {};
		const keys = Object.keys(object).sort(compare);

		cache.set(object, result);

		for (const key of keys) {
			const value = object[key];
			let newValue;
			path.push(key);

			if (deep && ignore && ignore(
				{
					key,
					value,
					path,
					depth: path.length,
				})) {
				Object.defineProperty(result, key, {
					...Object.getOwnPropertyDescriptor(object, key),
					value,
				});
				path.pop();
				continue;
			}

			if (deep && Array.isArray(value)) {
				newValue = deepSortArray(value, path);
			} else {
				newValue = deep && isPlainObject(value) ? _sortKeys(value, path) : value;
			}

			path.pop();
			Object.defineProperty(result, key, {
				...Object.getOwnPropertyDescriptor(object, key),
				value: newValue,
			});
		}

		return result;
	};

	if (Array.isArray(object)) {
		return deep ? deepSortArray(object) : [...object];
	}

	return _sortKeys(object);
}
