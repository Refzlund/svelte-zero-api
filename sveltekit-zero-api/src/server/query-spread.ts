import { KitEvent } from './kitevent'

function isObject(str: string) {
	return (str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))
}

/**
 * Determination rules:
 * ```ts
 * "abc"       => "abc"
 * "123.12"    => 123.12      // Only contains numbers
 * "$123.123"  => "$123.123"  // NaN
 * "123.12.12" => "123.12.12" // NaN
 * "true"      => true
 * "TRUE"      => "TRUE"      // Booleans has to be lowercase
 * "false"     => false
 * "undefined" => undefined
 * "null"      => null
 * "NULL"      => "NULL"      // `null` and `undefined` has to be lowercase
 * "{...}":    => {...}
 * "[...]"     => [...]
 * "2022-05-06T22:15:11.244Z" => new Date("2022-05-06T22:15:11.244Z") // Only accepts ISO-date strings (i.e. `new Date().toISOString()`) 
 * '"2022-05-06T22:15:11.244Z"' => new Date("2022-05-06T22:15:11.244Z") // Has quotes around the ISO-string (from `new Date()`)
 * ```
*/
export function querySpread<T extends KitEvent>(event: T) {
	let obj: Record<any, any> = {}
	for (const [key, value] of event.url.searchParams.entries()) {
		if (key in obj) {
			obj[key] = Array.isArray(obj[key]) ? [...obj[key], determine(value)] : [obj[key], determine(value)]
		} else {
			obj[key] = determine(value)
		}
	}
	return obj as any
}

function determine(value: string) {
	if (value === 'undefined')
		return undefined
	if (value === 'null')
		return null
	if (value === 'true' || value === '') // /home?example
		return true
	if (value === 'false')
		return false
	if (isObject(value))
		return JSON.parse(value)
	if (!Number.isNaN(Number(value)))
		return Number(value)
	if (value.match(/^"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"$/))
		return new Date(value.replace(/^"|"$/g, ''))
	if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/))
		return new Date(value)
	return value
}

export default querySpread