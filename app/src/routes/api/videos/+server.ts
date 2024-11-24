import { BadRequest, OK } from 'sveltekit-zero-api/http'
import { endpoint, ParseKitEvent } from 'sveltekit-zero-api/server'

export const POST = endpoint(
	async () => {},
	async (event) => {
		
		console.log(event.body)

		for await (const chunk of event.request.body!) {
			console.log({ chunk })
		}

		return new OK({ message: 'Video uploaded.' })
	}
)