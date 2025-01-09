import { OK } from 'sveltekit-zero-api/http'
import { endpoint, parseFormData } from 'sveltekit-zero-api/server'

export const POST = endpoint(
	parseFormData,
	async (event) => {
		
		console.log(event.body)

		for await (const chunk of event.request.body!) {
			console.log({ chunk })
		}

		return new OK({ message: 'Video uploaded.' })
	}
)
