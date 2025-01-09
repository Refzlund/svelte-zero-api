import { BadRequest } from '../http'
import { ParseKitEvent } from '../kitevent'

/**
 * Parse incoming JSON/FormData from the body.
 * Returns BadRequest if it is not any of those content-type's.
 * 
 * @example
 * 
 * const POST = endpoint(
 * 	parseFormData,
 * 	(event) => {
 * 		event.body // <- Parsed JSON
 * 	}
 )
 */
export const parseFormData = new ParseKitEvent(async (event) => {
	let formDataMime = 'multipart/form-data' as const
	let contentType = event.request.headers.get('content-type')

	if (!contentType || !contentType.includes(formDataMime)) {
		return new BadRequest({
			code: 'invalid_content_type',
			error: 'Content-Type header must be multipart/form-data',
			details: {
				expected: formDataMime,
				received: contentType || 'undefined'
			}
		})
	}

	let formData: FormData
	try {
		formData = await event.request.formData()
	} catch (error) {
		return new BadRequest(
			{
				code: 'invalid_formdata',
				error: 'Could not parse FormData',
				details:
					error !== null && typeof error === 'object' && 'toString' in error ? error.toString() : error
			},
			{ cause: error }
		)
	}

	return { body: formData }
})
