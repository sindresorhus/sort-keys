import isPlainObject from 'is-plain-obj';

// Build a new path array for the current key.
function buildPath(parentPathArray, key) {
	if (Array.isArray(parentPathArray) && parentPathArray.length > 0) {
		return [...parentPathArray, key];
	}

	return [key];
}

export default function sortKeys(object, options = {}) {
	if (!isPlainObject(object) && !Array.isArray(object)) {
		throw new TypeError('Expected a plain object or array');
	}

	const {deep = false, compare, ignoreKeys} = options;
	const cache = new WeakMap();

	// Check if a key should be ignored based on ignoreKeys option
	const shouldIgnoreKey = context => {
		if (Array.isArray(ignoreKeys)) {
			return ignoreKeys.includes(context.key);
		}

		if (typeof ignoreKeys === 'function') {
			return ignoreKeys(context);
		}

		return false;
	};

	// Check if deep processing should be applied
	const shouldProcessDeep = context => {
		if (typeof deep === 'boolean') {
			return deep;
		}

		if (typeof deep === 'function') {
			return deep(context);
		}

		return false;
	};

	// Deep sort an array
	const deepSortArray = (array, currentPath, currentDepth) => {
		const resultFromCache = cache.get(array);
		if (resultFromCache !== undefined) {
			return resultFromCache;
		}

		const result = [];
		result.length = array.length; // Preserve sparseness
		cache.set(array, result);

		for (const index of array.keys()) {
			if (!(index in array)) {
				continue; // Preserve holes in sparse arrays
			}

			const item = array[index];
			const indexKey = String(index);
			const itemPath = buildPath(currentPath, indexKey);
			const context = {
				key: indexKey,
				value: item,
				path: itemPath,
				depth: currentDepth + 1,
			};

			if (Array.isArray(item)) {
				result[index] = shouldProcessDeep(context)
					? deepSortArray(item, itemPath, currentDepth + 1)
					: item;
				continue;
			}

			if (isPlainObject(item)) {
				result[index] = shouldProcessDeep(context)
					? _sortKeys(item, itemPath, currentDepth + 1)
					: item;
				continue;
			}

			result[index] = item;
		}

		return result;
	};

	// Sort keys of an object
	const _sortKeys = (object, currentPath = [], currentDepth = 0) => {
		const resultFromCache = cache.get(object);
		if (resultFromCache !== undefined) {
			return resultFromCache;
		}

		const result = {};
		const allKeys = Object.keys(object);

		// Separate ignored and non-ignored keys
		const ignoredKeys = [];
		const keysToSort = [];

		for (const key of allKeys) {
			const value = object[key];
			const keyPath = buildPath(currentPath, key);
			const context = {
				key,
				value,
				path: keyPath,
				depth: currentDepth,
			};

			if (shouldIgnoreKey(context)) {
				ignoredKeys.push(key);
			} else {
				keysToSort.push(key);
			}
		}

		// Sort only the non-ignored keys
		const sortedKeys = keysToSort.sort(compare);

		// Combine ignored keys (in original order) with sorted keys
		const finalKeys = [...ignoredKeys, ...sortedKeys];

		cache.set(object, result);

		for (const key of finalKeys) {
			const value = object[key];
			const keyPath = buildPath(currentPath, key);
			const context = {
				key,
				value,
				path: keyPath,
				depth: currentDepth,
			};

			let newValue = value;

			// Only process deeply if shouldProcessDeep returns true
			if (shouldProcessDeep(context)) {
				if (Array.isArray(value)) {
					newValue = deepSortArray(value, keyPath, currentDepth);
				} else if (isPlainObject(value)) {
					newValue = _sortKeys(value, keyPath, currentDepth + 1);
				}
			}

			const descriptor = Object.getOwnPropertyDescriptor(object, key);
			if (descriptor.get || descriptor.set) {
				// Accessor descriptor: preserve as-is
				Object.defineProperty(result, key, descriptor);
			} else {
				// Data descriptor: carry over attributes but replace the value
				Object.defineProperty(result, key, {
					...descriptor,
					value: newValue,
				});
			}
		}

		return result;
	};

	// Handle top-level arrays
	if (Array.isArray(object)) {
		// Always route through deepSortArray to preserve holes and avoid copying extra props.
		// shouldProcessDeep() will govern recursion for boolean or function `deep`.
		return deepSortArray(object, [], -1);
	}

	return _sortKeys(object, [], 0);
}
