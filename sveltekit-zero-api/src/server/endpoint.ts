import { createEndpointProxy } from '../shared/endpoint-proxy'
import type { FixKeys, MaybePromise, Simplify } from '../utils/types'
import { Accepted, BadRequest, KitResponse, OK, ImATeapot } from './http'
import { ParseKitEvent, type KitEvent, type KitEventFn } from './kitevent'
import type { KitRequestProxy } from '../shared/endpoint-proxy.type'
import { Generic } from './generic'
import { parseResponse } from '../utils/parse-response'
import { SSE } from './sse'

/**
 * The "result" of an `endpoint` paramters `callback`
 */
export type EndpointCallbackResult = Record<PropertyKey, any> | KitResponse

/**
 * A callback function for an `endpoint` parameter.
 */
export type Callback<
	Event extends KitEvent<any, any> = KitEvent<any, any>,
	Result extends EndpointCallbackResult = EndpointCallbackResult
> = (event: Event) => Promise<Result> | Result | void

/**
 * The input for an endpoint.
 */
type EndpointInput<P extends ParseKitEvent> = P extends ParseKitEvent<infer T>
	? Simplify<FixKeys<Exclude<T, KitResponse<any, any>>>>
	: never

type GenericCallback = Generic<
	| ((body: any) => KitRequestProxy<KitResponse<any, any, any>>)
	/** When `body` is not available. E.g. `GET`, `HEAD`, `TRACE` */
	| ((options: { query: any }) => KitRequestProxy<KitResponse<any, any, any>>)
	| ((
		body: any,
		options: { query: any }
	) => KitRequestProxy<KitResponse<any, any, any>>)
>

/**
 * An `Endpoint`-type is the function type that is used to call an endpoint.
 * 
 * `api.users.GET` is an `Endpoint`
 * 
 * It my contain information about required body-type or query paramters.
 * 
 * For instance `api.users.POST` may be  
 * `Endpoint<{ body: User }, Created<{ message: 'User was created!' }> | BadRequest<{ code: 'name_taken', error: 'Username has already been taken.' }>>`
*/
export type Endpoint<
	Input extends {
		body?: any
		query?: any
	} = any,
	Result extends KitResponse<any, any> = KitResponse<any, any>
> = ((
	body?: Input['body'],
	options?: { query?: Input['query'] } & Omit<RequestInit, 'body'>
) => KitRequestProxy<Result>) & {
	xhr: (
		body?: Input['body'],
		options?: { query?: Input['query'] } & Omit<RequestInit, 'body'>
	) => KitRequestProxy<Result, never, true>
}

export type EndpointSSE<T extends SSE> = (
	options?: { query?: any } & Omit<RequestInit, 'body'>
) => T extends SSE<infer _, infer K> ? KitSSE<K> : never

export type KitSSE<T extends { event: string; data: any }> = {
	on: {
		[Key in T as Key['event']]: (cb: (event: Key['data']) => void) => KitSSE<T>
	}
	onClose(cb: () => void): KitSSE<T>
	onOpen(cb: (event: Event) => void): KitSSE<T>
	/** When connection to EventSource fails to be opened */
	onError(cb: (event: Event) => void): KitSSE<T>
	isClosed: boolean
	isOpen: boolean
	isConnecting: boolean
	close(): void
}

type EndpointResponseResult<
	Responses extends KitResponse,
	P extends ParseKitEvent,
	Tsse extends SSE,
	TGenericResult extends null | GenericCallback = null
> = Promise<Responses> & {
	use: null extends TGenericResult
	? [Tsse] extends [never]
	? Endpoint<
		EndpointInput<P>,
		| Responses
		| Extract<Awaited<ReturnType<P['fn']>>, KitResponse<any, any>>
	>
	: EndpointSSE<Tsse>
	: TGenericResult extends Generic<infer Input>
	? Input
	: never
}

/**
 * The return-type for an `endpoint`.
 */
export interface EndpointResponse<
	Results extends Callback | ParseKitEvent | GenericCallback | SSE
> {
	(event: KitEvent): EndpointResponseResult<
		Extract<
			ReturnType<Exclude<Results, ParseKitEvent | GenericCallback | SSE>>,
			KitResponse
		>,
		Extract<Results, ParseKitEvent>,
		Extract<Results, SSE>,
		// @ts-expect-error works
		Results extends (event: KitEvent) => MaybePromise<GenericCallback>
		? Awaited<ReturnType<Results>>
		: null
	>
}

// * Note:  I believe there's a limit to the amount of parameters
// *        so I'm limiting it to 7. Might be decreased in the future.
// #region endpoint overloads

function endpoint<
	B1 extends
	| ((event: KitEvent) => MaybePromise<GenericCallback | KitResponse>)
	| SSE<KitEvent, any>
>(
	/** When creating a `Generic` endpoint, the body WILL be parsed as JSON. */
	callback1: B1
): EndpointResponse<B1>

function endpoint<
	B1 extends Callback<KitEvent> | ParseKitEvent<{}>,
	B2 extends Callback<KitEventFn<B1>, KitResponse> | SSE<KitEvent, any>
>(callback1: B1, callback2: B2): EndpointResponse<B1 | B2>

function endpoint<
	B1 extends Callback<KitEvent> | ParseKitEvent<{}>,
	B2 extends Callback<KitEventFn<B1>> | ParseKitEvent<{}>,
	B3 extends Callback<KitEventFn<B1, B2>, KitResponse> | SSE<KitEvent, any>
>(callback1: B1, callback2: B2, callback3: B3): EndpointResponse<B1 | B2 | B3>

function endpoint<
	B1 extends Callback<KitEvent> | ParseKitEvent<{}>,
	B2 extends Callback<KitEventFn<B1>> | ParseKitEvent<{}>,
	B3 extends Callback<KitEventFn<B1, B2>> | ParseKitEvent<{}>,
	B4 extends Callback<KitEventFn<B1, B2, B3>, KitResponse> | SSE<KitEvent, any>
>(
	callback1: B1,
	callback2: B2,
	callback3: B3,
	callback4: B4
): EndpointResponse<B1 | B2 | B3 | B4>

function endpoint<
	B1 extends Callback<KitEvent> | ParseKitEvent<{}>,
	B2 extends Callback<KitEventFn<B1>> | ParseKitEvent<{}>,
	B3 extends Callback<KitEventFn<B1, B2>> | ParseKitEvent<{}>,
	B4 extends Callback<KitEventFn<B1, B2, B3>> | ParseKitEvent<{}>,
	B5 extends
	| Callback<KitEventFn<B1, B2, B3, B4>, KitResponse>
	| SSE<KitEvent, any>
>(
	callback1: B1,
	callback2: B2,
	callback3: B3,
	callback4: B4,
	callback5: B5
): EndpointResponse<B1 | B2 | B3 | B4 | B5>

function endpoint<
	B1 extends Callback<KitEvent> | ParseKitEvent<{}>,
	B2 extends Callback<KitEventFn<B1>> | ParseKitEvent<{}>,
	B3 extends Callback<KitEventFn<B1, B2>> | ParseKitEvent<{}>,
	B4 extends Callback<KitEventFn<B1, B2, B3>> | ParseKitEvent<{}>,
	B5 extends Callback<KitEventFn<B1, B2, B3, B4>> | ParseKitEvent<{}>,
	B6 extends
	| Callback<KitEventFn<B1, B2, B3, B4, B5>, KitResponse>
	| SSE<KitEvent, any>
>(
	callback1: B1,
	callback2: B2,
	callback3: B3,
	callback4: B4,
	callback5: B5,
	callback6: B6
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6>

function endpoint<
	B1 extends Callback<KitEvent> | ParseKitEvent<{}>,
	B2 extends Callback<KitEventFn<B1>> | ParseKitEvent<{}>,
	B3 extends Callback<KitEventFn<B1, B2>> | ParseKitEvent<{}>,
	B4 extends Callback<KitEventFn<B1, B2, B3>> | ParseKitEvent<{}>,
	B5 extends Callback<KitEventFn<B1, B2, B3, B4>> | ParseKitEvent<{}>,
	B6 extends Callback<KitEventFn<B1, B2, B3, B4, B5>> | ParseKitEvent<{}>,
	B7 extends
	| Callback<KitEventFn<B1, B2, B3, B4, B5, B6>, KitResponse>
	| SSE<KitEvent, any>
>(
	callback1: B1,
	callback2: B2,
	callback3: B3,
	callback4: B4,
	callback5: B5,
	callback6: B6,
	callback7: B7
): EndpointResponse<B1 | B2 | B3 | B4 | B5 | B6 | B7>

// #endregion

function endpoint(
	...callbacks: (Callback<any, any> | ParseKitEvent<{ body?; query?}>)[]
) {
	return (event: KitEvent) => {
		let useProxy: ReturnType<typeof createEndpointProxy> | null = null

		async function endpointHandler() {
			await new Promise((res) => res(true))

			event.results ??= {}
			if (event.request.headers.has('x-validation-schema')) {
				let cb = callbacks.find((v) => v instanceof ParseKitEvent)
				if (cb && cb.schema) throw new Accepted(cb.schema)
				throw new ImATeapot({
					code: 'no_validation_schema',
					error: 'No validation schema is associated with this endpoint.',
				})
			}

			let result: EndpointCallbackResult | void
			for (const callback of callbacks) {
				try {
					if (callback instanceof SSE) {
						const stream = callback.createStream(event)
						throw new OK(stream, {
							headers: {
								'Content-Type': 'text/event-stream',
								'Cache-Control': 'no-cache, no-transform',
								Connection: 'keep-alive',
							},
						})
					}

					if (callback instanceof ParseKitEvent) {
						let parse
						try {
							parse = await callback.fn(event)
						} catch (error) {
							if (error instanceof KitResponse || error instanceof Response)
								return error
							throw error
						}
						if (parse instanceof KitResponse || parse instanceof Response)
							return parse

						event.body = parse.body
						event.query ??= {}
						Object.assign(event.query, parse.query ?? {})
						continue
					}

					result = await callback(event)
					if (result instanceof Generic) {
						try {
							event.body = await event.request.json()
						} catch (error) {
							throw new BadRequest({
								code: 'invalid_json',
								error: 'A generic endpoint must receive JSON',
								details: error,
							})
						}
						result = await result.function()
					}
				} catch (error) {
					if (error instanceof KitResponse) {
						result = error
					} else {
						throw error
					}
				}
				if (result instanceof KitResponse) {
					return result
				}

				if (result) {
					Object.assign(event.results!, result)
				}
			}

			return result!
		}

		const promise = endpointHandler()
			.catch((err) => {
				if (err instanceof KitResponse) {
					return err
				}
				throw err
			}) as Promise<Response>

		Object.assign(promise, {
			use(input?: { body?: unknown }, options?: { query?: unknown }) {
				const headers = event.request.headers ?? new Headers()

				let body: BodyInit | null = null
				let method = event.request.method

				if (String(input) === '[object Object]') {
					body = JSON.stringify(input)
					headers.set('content-type', 'application/json')
					method = method === 'GET' ? 'POST' : method
				}

				event.request = new Request(event.request.url, {
					...event.request,
					method,
					headers,
					body,
				})

				event.query ??= {}
				Object.assign(event.query, options?.query ?? {})

				useProxy ??= createEndpointProxy(
					promise
						.catch(async (res) => {
							if (!('headers' in res)) throw res
							return res as Response
						})
						.then(parseResponse),
					() => {
						throw new Error("Can't abort on server.")
					}
				)
				return useProxy
			},
		})

		return promise
	}
}

export { endpoint }
