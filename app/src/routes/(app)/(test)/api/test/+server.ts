import { BadRequest, InternalServerError, OK } from 'sveltekit-zero-api/http'
import { functions } from 'sveltekit-zero-api/server'

function someFunction() {
	if (Math.random() > 0.95) {
		throw new Error('Unlucky coincidence.')
	}
	if (Math.random() > 0.5) {
		return new BadRequest({
			code: 'user_error',
			error: 'You made a mistake. Being unlucky that is.'
		})
	}
	return new OK({ message: 'ok' })
}

export const PATCH = functions({
	someFunction
})
