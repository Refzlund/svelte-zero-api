import type { UnionToIntersection } from './../utils/types'
import type { Functions, FnsRecord } from './functions.type'
import { Generic } from './generic'
import { BadRequest, InternalServerError, KitResponse } from './http'
import { FakeKitEvent, type KitEvent } from './kitevent'

type FunctionCallbackResult = Record<PropertyKey, any> | KitResponse | void

type FnCallback<
	Result extends FunctionCallbackResult = FunctionCallbackResult,
	R1 extends FunctionCallbackResult = never,
	R2 extends FunctionCallbackResult = never,
	R3 extends FunctionCallbackResult = never,
	R4 extends FunctionCallbackResult = never,
	R5 extends FunctionCallbackResult = never,
	R6 extends FunctionCallbackResult = never
> = (
	event: KitEvent<FunctionsBody, UnionToIntersection<Exclude<R1 | R2 | R3 | R4 | R5 | R6, KitResponse>>>
) => Result | Promise<Result>

interface FunctionsBody {
	body: {
		function: string
		arguments: unknown[]
	}
}

/**
 * Creates an endpoint with the functions format.
 * Via the API instead of calling it like `let response = await api.users.POST({...})`
 * you interact with it more like a normal function: `let newUser = await api.users.createUser({...})`
 *
 * You can either submit `FormData`, `ReadableStream` or mulitple arguments passed as a JSON-array.
 *
 * **JSON Request**
 * ```
 * Headers
 *     x-function: someFn
 *     content-type: application/json
 * Body
 *     [
 *         ...
 *     ] // arguments-array passed to function name
 * ```
 * It's of course limited to JSON applicable content.
 *
 * `ReadableStream`
 * ```
 * Headers
 *     x-function: someFn
 *     content-type: application/octet-stream
 * Body
 *     ReadableStream
 * ```
 *
 * `FormData`
 * ```
 * Headers
 *     x-function: someFn
 *     content-type: multipart/form-data
 * Body
 *     FormData
 * ```
 *
 *
 * @note Do not end function names in `$` as those are reserved for route slugged params.
 */
export function functions<const Fns extends FnsRecord>(
	fns: Fns
): (event?: KitEvent<FunctionsBody>) => Promise<KitResponse> & { use(): Functions<Fns> }

// #region functions overloads

export function functions<const Fns extends FnsRecord, B1 extends FunctionCallbackResult>(
	cb1: FnCallback<B1>,
	fns: Fns
): (event?: KitEvent<FunctionsBody>) => Promise<KitResponse> & { use(): Functions<Fns, Extract<B1, KitResponse>> }

export function functions<
	const Fns extends FnsRecord,
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	fns: Fns
): (event?: KitEvent<FunctionsBody>) => Promise<KitResponse> & {
	use(): Functions<Fns, Extract<B1 | B2, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord,
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	fns: Fns
): (event?: KitEvent<FunctionsBody>) => Promise<KitResponse> & {
	use(): Functions<Fns, Extract<B1 | B2 | B3, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord,
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult,
	B4 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	cb4: FnCallback<B4, B1, B2, B3>,
	fns: Fns
): (event?: KitEvent<FunctionsBody>) => Promise<KitResponse> & {
	use(): Functions<Fns, Extract<B1 | B2 | B3 | B4, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord,
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult,
	B4 extends FunctionCallbackResult,
	B5 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	cb4: FnCallback<B4, B1, B2, B3>,
	cb5: FnCallback<B5, B1, B2, B3, B4>,
	fns: Fns
): (event?: KitEvent<FunctionsBody>) => Promise<KitResponse> & {
	use(): Functions<Fns, Extract<B1 | B2 | B3 | B4 | B5, KitResponse>>
}

export function functions<
	const Fns extends FnsRecord,
	B1 extends FunctionCallbackResult,
	B2 extends FunctionCallbackResult,
	B3 extends FunctionCallbackResult,
	B4 extends FunctionCallbackResult,
	B5 extends FunctionCallbackResult,
	B6 extends FunctionCallbackResult
>(
	cb1: FnCallback<B1>,
	cb2: FnCallback<B2, B1>,
	cb3: FnCallback<B3, B1, B2>,
	cb4: FnCallback<B4, B1, B2, B3>,
	cb5: FnCallback<B5, B1, B2, B3, B4>,
	cb6: FnCallback<B6, B1, B2, B3, B4, B5>,
	fns: Fns
): (event?: KitEvent<FunctionsBody>) => Promise<KitResponse> & {
	use(): Functions<Fns, Extract<B1 | B2 | B3 | B4 | B5 | B6, KitResponse>>
}

// #endregion

export function functions(...args: (FnCallback | FnsRecord)[]) {
	let fns = args.pop()! as FnsRecord
	let cbs = args as FnCallback[]

	function functionsHandler(event: KitEvent<FunctionsBody, never>) {
		event ??= new FakeKitEvent() // when testing

		let proxyUse: ReturnType<typeof createUseProxy> | null = null
		let promise = functionRequest(event, fns!, cbs, () => proxyUse)
			.catch((r) => {
				if (r instanceof KitResponse)
					return r
				throw r
			})
		
		Object.assign(promise, {
			use() {
				proxyUse ??= createUseProxy(event, fns, cbs)
				return proxyUse
			}
		})

		return promise
	}

	return functionsHandler
}

async function functionRequest(
	event: KitEvent<any, never>,
	fns: FnsRecord,
	cbs: FnCallback[],
	proxyUse?: () => any
) {
	await new Promise((res) => res(true))
	if (proxyUse?.()) return

	const contentType = event.request.headers.get('content-type')
	let args = null as null | [ReadableStream] | [FormData] | Array<unknown>
	if (contentType === 'application/json') {
		try {
			args = await event.request.json()
		} catch (error) {
			throw new BadRequest({ code: 'invalid_json', error: 'Invalid JSON', details: error })
		}
	} else if (contentType === 'application/octet-stream') {
		args = [event.request.body]
	} else if (contentType === 'multipart/form-data') {
		try {
			args = [await event.request.formData()]
		} catch (error) {
			throw new BadRequest({ code: 'invalid_form_data', error: 'Invalid form data', details: error })
		}
	} else if (contentType !== null) {
		throw new BadRequest({
			code: 'invalid_content_type',
			error: 'Invalid Content-Type header',
			details: {
				expected: ['application/json', 'application/octet-stream'],
				received: contentType
			}
		})
	}

	let fn = event.request.headers.get('x-function')
	if (!fn || typeof fn !== 'string') {
		throw new BadRequest({
			code: 'missing_function',
			error: 'Please provide a function, by adding the `x-function` header.'
		})
	}

	if (!fns[fn]) {
		throw new BadRequest({
			code: 'invalid_function',
			error: 'Invalid function name'
		})
	}

	if (args && !Array.isArray(args)) {
		throw new BadRequest({
			code: 'invalid_arguments',
			error: 'Provided arguments must be an array',
			details: {
				expected: 'array',
				received: typeof args
			}
		})
	}

	try {
		for (const cb of cbs) {
			const result = await cb(event)
			if (result instanceof KitResponse) {
				return result
			}
			if (typeof result === 'object') {
				event.results ??= {}
				Object.assign(event.results, result)
			}
		}

		let result = await fns[fn](event, ...(args || []))
		if (result instanceof Generic) {
			result = (await result.function(...(args || []))) as KitResponse
		}
		return result
	} catch (error) {
		if (error instanceof KitResponse) {
			throw error
		}

		throw new InternalServerError(
			{
				code: 'function_failed',
				error: 'An unexpected error occurred when running the function.'
			},
			{ cause: error }
		)
	}
}

function createUseProxy(event: KitEvent<any, never>, fns: FnsRecord, cbs: FnCallback[]) {
	return new Proxy(fns!, {
		get(target, key: string) {
			if (!(key in target)) {
				return target[key]
			}
			return (...args: [any]) => {
				const headers = event.request.headers
				let body: BodyInit

				headers.set('x-function', key)
				if (!args.length) {
					// No arguments
				} else if (args[0] instanceof ReadableStream) {
					throw new Error('ReadableStreams requires Duplex which is not well supported across browsers atm.')
					body = args[0]
					headers.set('content-type', 'application/octet-stream')
				} else if (args[0] instanceof FormData) {
					body = args[0]
					// is set automatically
					// headers.set('content-type', 'multipart/form-data')
				} else {
					// * JSON
					body = JSON.stringify(args)
					headers.set('content-type', 'application/json')
				}

				event.request = new Request(event.request.url, {
					...event.request,
					method: 'PATCH',
					headers,
					body: body!
				})

				return new Promise((resolve, reject) => {
					functionRequest(event, fns, cbs)
						.then((v) => {
							if (!v) {
								throw new Error()
							}
							if (!v.ok) {
								return reject(v)
							}
							if (v.headers.get('content-type') === 'application/json') {
								return resolve(v.body)
							}
							if (v.headers.get('content-type') === 'multipart/form-data') {
								return resolve(v.body)
							}
							return resolve(v.body)
						})
						.catch(reject)
				})
			}
		}
	})
}
