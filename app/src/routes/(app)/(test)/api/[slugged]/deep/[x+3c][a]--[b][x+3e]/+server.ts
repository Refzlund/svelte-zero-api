import { InternalServerError, BadRequest, OK } from 'sveltekit-zero-api/http'
import { endpoint, functions } from 'sveltekit-zero-api/server'

export const POST = endpoint(() => {
	return new OK('hellooo')
})

function someFunction() {
	if (Math.random() > 0.5) {
		throw new BadRequest({
			code: 'unlucky_call',
			error: 'Unlucky'
		})
	}
	return new OK({ message: 'ok' })
}

export const PATCH = functions({
	someFunction
})
