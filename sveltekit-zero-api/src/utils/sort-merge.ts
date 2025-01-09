/**
 * Merges two sorted arrays into a single sorted array using the provided comparison function.
 *
 * @template T - The type of the elements in the arrays.
 * @param {T[]} arr - The first sorted array.
 * @param {T[]} newItems - The second array containing new items to be merged, which will be sorted if not already.
 * @param {Function} compareFn - A function that defines the sort order. It should return a negative number if the first argument is less than the second, zero if they're equal, and a positive number if the first argument is greater.
 * @returns {T[]} A new array containing all elements from both input arrays, sorted.
*/
export function mergeSortedArrays<T>(
	arr: T[],
	newItems: T[],
	compareFn: (a: T, b: T) => number
): T[] {
	// Sort the new items if not already sorted
	newItems.sort(compareFn)

	// Merge the two sorted arrays
	const result: T[] = []
	let i = 0,
		j = 0

	while (i < arr.length && j < newItems.length) {
		if (compareFn(arr[i], newItems[j]) <= 0) {
			result.push(arr[i++])
		} else {
			result.push(newItems[j++])
		}
	}

	// Add remaining items from either array
	return result.concat(arr.slice(i)).concat(newItems.slice(j))
}

/**
 * Inserts an item into a sorted array while maintaining the sort order.
 *
 * @template T - The type of the elements in the array.
 * @param {T[]} arr - The sorted array where the item will be inserted.
 * @param {T} item - The item to be inserted.
 * @param {Function} compareFn - A function that defines the sort order. It should return a negative number if the first argument is less than the second, zero if they're equal, and a positive number if the first argument is greater.
 * @returns {T[]} The updated array with the new item inserted.
 */
export function insertSorted<T>(arr: T[], item: T, compareFn: (a: T, b: T) => number): T[] {
	// Find the correct index using binary search
	let left = 0
	let right = arr.length

	while (left < right) {
		const mid = Math.floor((left + right) / 2)
		if (compareFn(arr[mid], item) < 0) {
			left = mid + 1
		} else {
			right = mid
		}
	}

	// Insert the item at the found position
	arr.splice(left, 0, item)

	return arr // Return the updated array (optional)
}