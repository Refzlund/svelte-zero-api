import { UAParser } from 'ua-parser-js'
import { zeroAPI } from 'sveltekit-zero-api/server'

export const handle = zeroAPI({}).sequence(
	async ({ event, resolve }) => {
		const userAgent = new UAParser(event.request.headers.get('user-agent') || '')
		event.locals.mobile = ['mobile', 'wearable'].includes(userAgent.getDevice().type || '')

		const response = await resolve(event)
		return response
	}
)