import type { getEndpointFiles } from './get-endpoint-files'

/**
 * ex
 *
 * ```
 * [
 *     "/routes/api/(group)/[others=filter]/[a=param]+[b]/+server.ts",
 *     [
 *         "api",
 *         "[others]",
 *         "[a]"
 *     ]
 * ]
 * ```
 */
export function serializeFiles(files: ReturnType<typeof getEndpointFiles>, routesLength: number) {
	/** https://svelte.dev/docs/kit/advanced-routing#Encoding */
	let encodingMap = {
		'[x+5c]': '\\',
		'[x+2f]': '/',
		'[x+3a]': ':',
		'[x+2a]': '*',
		'[x+3f]': '?',
		'[x+22]': '"',
		'[x+3c]': '<',
		'[x+3e]': '>',
		'[x+7c]': '|',
		'[x+23]': '#',
		'[x+25]': '%',
		'[x+5b]': '[',
		'[x+5d]': ']',
		'[x+28]': '(',
		'[x+29]': ')'
	}

	const encodingRegex = new RegExp(
		Object.keys(encodingMap)
			.map((v) => v.replaceAll(/\[|\]|\+/g, (v) => '\\' + v))
			.join('|'),
		'g'
	)

	let serializedFiles = [] as [string, string[]][]

	for (let file of files) {
		const serialized = file
			.split('/')
			.slice(routesLength + 1, -1) // exclude empty '/', src, routes folder
			.map((v) =>
				v
					.replaceAll(encodingRegex, (v) => encodingMap[v])
					.replaceAll(/=[^\]]+\]/g, ']')
					.replaceAll('"', '')
			)
			.filter((key) => !/\(.*\)/.test(key))

		serializedFiles.push([file, serialized])
	}

	return serializedFiles.sort((a, b) => a[1].length - b[1].length)
}
