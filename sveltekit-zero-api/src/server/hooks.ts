import type { Handle, ResolveOptions } from '@sveltejs/kit'
import { KitResponse } from './http'
import type { KitEvent } from './kitevent'
import { sequence as sveltekitSequence } from '@sveltejs/kit/hooks'
import { convertResponse } from './convert-response'
import querySpread from './query-spread'

export type KitHandle = (input: {
	event: KitEvent
	resolve: (event: KitEvent, opts?: ResolveOptions) => Promise<KitResponse | Response>
}) => Promise<KitResponse | Response> | KitResponse | Response

export interface ZeroAPIServerOptions {
	client?: {}
	sever?: {
		/**
		 * Whether to stringify objects to JSON when no 'content-type' is provided.
		 *
		 * If you do `setHeader('content-type', ...)` then it won't stringify.
		 *
		 * @default true
		 */
		stringify?: boolean

		/**
		 * Log KitResponses that has `{ cause: ... }`?
		 *
		 * @default 'non-ok'
		 */
		logWithCause?: 'non-ok' | 'all' | false
	}
}

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
 *     zeroAPI({...}),
 *     (...) => {
 *
 *     }
 * )
 * 
 * /// Optionally, if you want use KitEvent-type and return KitResponse 
 * /// without type-errors, you can do
 * 
 * export const handle = zeroAPI({...}).sequence(
 *     (...) => {
 *
 *     }
 })
 */
export function zeroAPI(options: ZeroAPIServerOptions) {
	const handle: Handle = async ({ event, resolve }) => {
		// @ts-expect-error RequestEvent should not have `results` inside of it.
		event.results ??= {}
		// @ts-expect-error Just adding options to event
		event.zeroAPIOptions = options

		// @ts-expect-error RequestEvent should not have `query` inside of it.
		event.query = querySpread(event as KitEvent)

		let response: Response

		let time = Date.now()

		try {
			response = await resolve(event)
		} catch (error) {
			if (!(error instanceof KitResponse)) throw error
			response = error as any
		}

		response = convertResponse(response, options)

		response.headers.append('xt', String(Date.now() - time))
		return response
	}

	function sequence(...handlers: KitHandle[]) {
		return sveltekitSequence(handle, ...(handlers as unknown as Handle[]))
	}

	Object.assign(handle, { sequence })

	return handle as typeof handle & { sequence: typeof sequence }
}
