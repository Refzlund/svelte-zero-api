import { OK } from 'sveltekit-zero-api/http'
import { endpoint, parseJSON } from 'sveltekit-zero-api/server'

export const _POST = 123

export const POST = endpoint(
	parseJSON,
	async (event) => {
		
		console.log(event.body)

		return new OK({ message: 'Form data received.', data: event.body })
	}
)
