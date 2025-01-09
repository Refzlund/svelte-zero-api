import type { KitRequestProxy } from '../shared/endpoint-proxy.type'
import type { Promisify } from '../utils/types'
import type { InternalServerError, KitResponse, StatusCode } from './http'
/**
 * We use the `GenericFn` class to tell `sveltekit-zero-api` that it
 * needs to call the returned function instead of returning it immediately — expecting a KitResponse.
 *
 * @example
 * interface Input {
 *     name: string
 *     age: number
 * }
 *
 * function someFn<T extends Simplify<Input>>(event: KitEvent, input: T) {
 *     if (Math.random() > 0.5) {
 *         return new BadRequest({ code: 'invalid', error: 'You are quite the unlucky fellow.' })
 *     }
 *
 *     return new OK({
 *         providedData: input
 *     })
 * }
 *
 * const PATCH = functions({
 *     someFn,
 *     specificFn: (event) =>
 *         /// We provide GenericFn to tell the endpoint to call an additional functioon
 *         new GenericFn(<const T extends Input>(input: T) => {
 *             /// We use GenericFn.return to return correct type
 *             return GenericFn.return(someFn(event, input))
 *         })
 *     }
 * )
 */
export class Generic<T extends Function> {
	function: T
	constructor(fn: T) {
		this.function = fn
	}

	/**
	 * We use this function to "type" the response of a `functions({ ... })`-fn correctly.
	 */
	static fn<T extends KitResponse>(response: T) {
		return response as unknown as Promisify<
			Extract<T, KitResponse<StatusCode['Success']>>['body'],
			| Exclude<Extract<T, KitResponse>, KitResponse<StatusCode['Success']>>
			| InternalServerError<{
				code: 'function_failed'
				error: 'An unexpected error occurred when running the function.'
			}>
		>
	}

	static endpoint<T extends KitResponse>(response: T) {
		return response as unknown as KitRequestProxy<T>
	}
}
