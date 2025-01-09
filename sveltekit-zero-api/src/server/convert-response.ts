import type { ZeroAPIServerOptions } from './hooks'
import { KitResponse } from './http'

export function convertResponse<T>(response: T | KitResponse, options: ZeroAPIServerOptions = {}): T | Response {
	if (!(response instanceof KitResponse)) return response

	let { client: {} = {}, sever: { stringify = true, logWithCause = 'non-ok' } = {} } = options

	// @ts-expect-error Hidden property
	let cause = response.cause as unknown // TODO instance of error - then include stack
	if (cause && (logWithCause === 'all' || (logWithCause === 'non-ok' && !response.ok))) {
		let stringed = cause.toString()
		if (stringed.startsWith('[object ') && stringed.endsWith(']')) {
			try {
				stringed = JSON.stringify(cause)
			} catch (error) {
				stringed = 'Could not parse KitResponse[cause] into string: ' + error
			}
		}

		let responseMsg = (response as unknown as { message: string }).message

		let stack = cause instanceof Error ? cause.stack : ''

		console.log(`
${responseMsg.split('\n').splice(2).join('\n')}
\x1b[33mKitResponse cause\x1b[0m
${stack || stringed}
`)
	}

	let body = response.body
	const type = typeof body

	let isJSONable =
		(type == 'object' && ('toJSON' in body || String(body).endsWith('Object]'))) 
		|| type === 'string'
		|| type === 'number'
		|| type === 'boolean'
		|| type === 'bigint'
	
	let contentType = response.headers.has('content-type')

	if (stringify && !contentType && isJSONable) {
		response.headers.append('content-type', 'application/json')
		body = JSON.stringify(body)
	}
	else if(body && !contentType) {
		response.headers.append('content-type', 'plain/text')
	}

	return new Response(body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	}) as any
}
