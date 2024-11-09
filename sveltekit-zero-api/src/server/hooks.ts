import type { Handle } from '@sveltejs/kit'
import { KitResponse } from './http.ts'

/**
 *
 * [SvelteKit ZeroAPI](https://github.com/Refzlund/sveltekit-zero-api) —
 * Middleware for SvelteKit hooks handler. Catches and translates `KitResponse` to `Response`.
 *
 * @example
 *
 * import { sequence } from '@sveltejs/kit/hooks'
 * import { zeroapi } from 'sveltekit-zero-api/server'
 *
 * export const handle = sequence(
 *     zeroAPI(),
 *     (...) => {
 *
 *     }
 * )
 *
 */
export const zeroAPI: Handle = async ({ event, resolve }) => {
	// @ts-expect-error RequestEvent should not have `results` inside of it.
	event.results ??= {}
	let response: unknown

	try {
		response = await resolve(event)
	} catch (error) {
		if (!(error instanceof KitResponse)) throw error
		response = error
	}

	if (!(response instanceof KitResponse)) return response

	return new Response(response.body, {
		status: response.status,
		headers: response.headers
	}) as any
}
