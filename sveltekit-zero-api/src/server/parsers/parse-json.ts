import { parseItems } from '../../utils/parse-keys'
import { BadRequest } from '../http'
import { ParseKitEvent } from '../kitevent'

/**
 * Parse incoming JSON/FormData from the request.body.  
 * Parses date-strings to dates. For `FormData` it will also parse number-strings to numbers. 
 * 
 * Returns BadRequest if it is not any of those content-type's.
 * 
 * @example
 * 
 * const POST = endpoint(
 * 	parseJSON,
 * 	(event) => {
 * 		event.body // <- Parsed JSON
 * 	}
 )
 */
export const parseJSON = new ParseKitEvent(async (event) => {
	type T = Record<string | number, unknown>
	let json: T

	let contentTypes = ['application/json', 'multipart/form-data'] as const
	let contentType = event.request.headers.get('content-type') as (typeof contentTypes)[number]

	if (!contentType || !contentTypes.some((v) => contentType.includes(v))) {
		return new BadRequest({
			code: 'bad_content_type',
			error: 'Bad Content-Type header',
			details: {
				expected: contentTypes,
				received: (contentType as string) || 'undefined'
			}
		})
	}

	let isFormData = false
	if (contentType.includes('multipart/form-data')) {
		isFormData = true
		try {
			const formData = await event.request.formData()
			json = parseItems(formData) as T
		} catch (error) {
			return new BadRequest({
				code: 'invalid_formdata',
				error: 'Could not parse FormData',
				details: String(<any>error)
			})
		}
	} else {
		try {
			json = await event.request.json()
		} catch (error) {
			return new BadRequest({
				code: 'invalid_json',
				error: 'Could not parse JSON',
				details: String(<any>error)
			})
		}
	}

	if(json) {
		const numberRegex = /^[1-9][0-9]*(\.[0-9]+)?$/
		const dateRegex =
			/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/

		function parser(item: unknown) {
			if(item === undefined || item === null) {
				return item
			}
			if(typeof item !== 'object') {
				try {
					return isFormData && numberRegex.test(item as string) ? +item : typeof item === 'string' && dateRegex.test(item) ? new Date(item) : item
				} catch (error) {
					return item
				}
			}
			for(const [key, value] of Object.entries(item)) {
				item[key] = parser(value)
			}
			return item
		}
		json = parser(json) as typeof json
	}

	return { body: json }
})
