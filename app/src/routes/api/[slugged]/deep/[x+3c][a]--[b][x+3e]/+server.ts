import { InternalServerError, BadRequest, OK } from '@scope/sveltekit-zero-api/http'
import { endpoint, functions } from '@scope/sveltekit-zero-api/server'

export const POST = endpoint(
	() => {
		return new OK({})
	}
)

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