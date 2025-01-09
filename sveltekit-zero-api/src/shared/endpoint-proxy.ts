import type { KitResponse } from '../server/http'
import { proxyCrawl, type StateApply, type StateGet } from '../utils/proxy-crawl'
import type { KitRequestProxy } from './endpoint-proxy.type'

/**
 * A proxied request — A shortcut to `KitRequestProxy<..., never, false>` and can be used in code as `value instanceof KitRequest`
 */
export class KitRequest {
	constructor() {
		throw new Error('Cannot construct EndpointProxy. Please use `createEndpointProxy` instead.')
	}
}
export interface KitRequest extends KitRequestProxy<KitResponse<any, any, any, boolean>, never, false> { }

/**
 * A proxied request — A shortcut to `KitRequestProxy<..., never, true>` and can be used in code as `value instanceof KitRequestXHR`
 */
export class KitRequestXHR extends KitRequest {}
export interface KitRequestXHR extends KitRequestProxy<KitResponse<any, any, any, boolean>, never, true> { }

/**
 * An EndpointProxy that has marked a `.$.` to return an array of promised callbacks.
 */
export class ReturnedKitRequest {
	constructor() {
		throw new Error(
			'Cannot construct ReturnedEndpointProxy. Please use `createEndpointProxy` and use `.$` instead.'
		)
	}
}
export interface ReturnedKitRequest extends KitRequestProxy<KitResponse<any, any, any, boolean>, any[]> { }

export class ReturnedKitRequestXHR extends ReturnedKitRequest { }
export interface ReturnedKitRequestXHR
	extends KitRequestProxy<KitResponse<any, any, any, boolean>, any[], true> { }

type ResponseType = KitResponse | Response

/** @note In order to get correct types, the response should be `Promise<KitResponse>` */
export function createEndpointProxy<T extends KitResponse>(
	pureResponse: Promise<T | Response>,
	abort?: () => void,
	xhr?: XMLHttpRequest,
): KitRequestProxy<T, never> {
	// Proxy
	// ex. `let [result] = GET(event, { body: { ... }}).error(...).$.OK(...)`

	/** Callbacks */
	let cbs: [string, (response: ResponseType) => any][] = []

	const response = new Promise<T | Response>((resolve, reject) => {
		pureResponse
			.then((res) => res)
			.catch((res) => res)
			.then((res) => {
				// By setting the timeout to 0, we wait a 'JS tick' and
				// allow potential chained callbacks to take place.
				setTimeout(async () => {
					if (typeof res !== 'object' || !('statusText' in res)) {
						throw res
					}

					let response = res as T | Response

					if (response instanceof Response) {
						// * Do some magic? (e.g. if frontend, do .json())
						// Note: This is done in `client/api-proxy.ts`
					}

					for (const cb of cbs) {
						await endpointProxyCallback(response, cb[0], cb[1]).catch(reject)
					}

					resolve(response)
				}, 0)
			})
	})

	return proxyCrawl<CrawlerProps>({
		getPrototypeOf(state) {
			if (state.keys[0] === '$') {
				if (xhr) return KitRequestXHR.prototype
				return ReturnedKitRequest.prototype
			}
			if (xhr) return KitRequestXHR.prototype
			return KitRequest.prototype
		},
		get(state) {
			let { keys, key, props, crawl, parent } = state

			if (key === '$' && keys.includes(key)) {
				throw new Error('.$. cannot be used multiple times.', {
					cause: {
						state: { keys, key, $promises: props.$promises?.map((v) => v[0]) },
						cbs: cbs.map((v) => v[0])
					}
				})
			}

			if (keys[0] === '$') {
				// * `[promiseA, promiseB] = ...$.success(...).error(...)` for instance
				if (key === Symbol.iterator) {
					// -> const [promiseOK, promiseError] = GET(...).$...
					const closest = closest$promisesParent(state)
					let array = closest.is$root ? [] : closest.$promises!.map((v) => v[1])
					return array[Symbol.iterator].bind(array)
				}

				// * `...$.success(...).error(...).length`
				if (props.$promises?.[key]) {
					return props.$promises[key]
				}

				// * `...$.success(...).error(...)[0]`
				if (typeof key !== 'symbol') {
					let index = Number(key)
					if (!isNaN(index)) {
						const closest = closest$promisesParent(state)
						if (closest.is$root)
							// * Since any index of an empty array is just undefined.
							return undefined
						return closest.$promises![index]?.[1] // -> GET(...).$...()[2]
					}
				}
			}

			return crawl(key)
		},
		apply(state) {
			let { keys, key, args, props, crawl, parent } = state

			if (key === 'abort') {
				return abort?.()
			}

			if (key === 'then' || key === 'catch' || key === 'finally') {
				if (keys[0] !== '$') {
					// * Without $ we just return the response.
					return response[key].apply(response, args as [])
				}

				// * $.success(...).error(...).then(v) return Promise<[...unknown[]]>
				const closest = closest$promisesParent(state)

				if (closest.is$root) {
					// * Means we're at the root of $ — e.g. `...$.then(...)`, which is just an empty array
					const promise = (closest.parent!.props.$cache ??= new Promise((resolve) => resolve([])))
					return promise[key].apply(promise, args as [])
				}

				const promise = (closest.parent!.props.$cache ??= new Promise((resolve, reject) => {
					let $promises = closest.$promises!

					let results = Array($promises.length).fill(undefined)
					let error: unknown = false
					let resolved = 0
					for (let i = 0;i < $promises.length;i++) {
						const promise = $promises[i][1]
						promise
							.then((v) => {
								results[i] = v
							})
							.catch((e) => {
								error = e
							})
							.finally(() => {
								resolved++
								if (resolved === $promises.length) {
									if (error) reject(error)
									resolve(results)
								}
							})
					}
				}))

				return promise[key].apply(promise, args as [])
			}

			if (key === Symbol.toPrimitive) {
				let $promises = keys[0] === '$' ? closest$promisesParent(state).$promises : undefined

				let str = 'EndpointProxy' + (cbs.length || $promises ? ':' : '')
				if (cbs.length) str += ` [${cbs.map((v) => v[0]).join(', ')}]`
				if ($promises) {
					str += `  $: [${$promises.map((v) => v[0]).join(', ')}]`
				}
				return str
			}

			let crawler = crawl([])

			if (typeof args[0] !== 'function') {
				throw new Error('Callback must be a function', { cause: { keys, key, args } })
			}

			let k = key.toString()
			if (k.startsWith('xhr') || k.startsWith('upload')) {
				if (!xhr) {
					throw new Error('This request is not associated with an XMLHttpRequest (xhr)', {
						cause: { keys, key, args }
					})
				}

				let upload = k.startsWith('upload')
				let event = k.slice(upload ? 6 : 3).toLowerCase()

				const fn = (ev: any) => {
					if (event === 'init') return args[0](xhr)
					args[0](ev, xhr)
				}
				if (upload) {
					xhr.upload.addEventListener(event, fn)
				} else {
					xhr.addEventListener(event, fn)
				}

				return crawler
			}

			if (keys[0] !== '$') {
				cbs.push([key as string, args[0]])
				return crawler
			}

			// * If `...$.success().error().map(v => ...)` for instance.
			let fn = props.$promises?.[key as string]
			if (typeof fn === 'function') {
				return fn.apply(fn, args)
			}

			let promise = new Promise((resolve, reject) => {
				response
					.then((response) => {
						let fn = args[0]
						endpointProxyCallback(response, key as string, fn).then(resolve).catch(reject)
					})
					.catch(reject)
			})

			let closest = closest$promisesParent(state.parent)
			props.$promises = [...(closest.$promises || []), [key as string, promise]]

			return crawler
		}
	}) as any
}

/**
 * We're managing the 'state' for each crawl individually. If you
 * did `$.success(...).error(...)` you would get [Promise, Promise]
 *
 * Without the state, if you from that same root did `$.OK(...)` it would
 * be appended to the others, but you would get the wrong type.
 *
 * With the state, each callback has an array (`$promises`) of the promises
 * within the same chain. So `OK` would not append the Promise to the others.
 */
interface CrawlerProps {
	$promises?: [string, Promise<unknown>][]
	/**
	 * Is a 'Promise-cache', so when you do `v.then(); v.then()` you
	 * would relate to the same promise, rather than creating a new one
	 * every time.
	 */
	$cache?: Promise<unknown>
}

/** Find the closest parent where `props.$promises !== undefined` */
function closest$promisesParent(state?: StateGet<CrawlerProps> | StateApply<CrawlerProps>) {
	let parentIsRoot = state!.key === '$'
	while (!parentIsRoot && state && !state.props.$promises) {
		state = state.parent
		parentIsRoot = state?.key === '$'
	}
	return {
		parent: state,
		/** Is parent the .$. root? E.g. `key === '$'` */
		is$root: parentIsRoot,
		$promises: state?.props.$promises
	}
}

async function endpointProxyCallback(
	result: ResponseType,
	statusText: string,
	cb: (response: ResponseType) => any
) {
	if (statusText === 'any')
		return await cb(result)
	if (statusText === result.statusText)
		return await cb(result)
	if (result.status >= 100 && result.status < 200 && statusText === 'informational')
		return await cb(result)
	if (result.status >= 200 && result.status < 300 && statusText === 'success')
		return await cb(result)
	if (result.status >= 300 && result.status < 400 && statusText === 'redirect')
		return await cb(result)
	if (result.status >= 400 && result.status < 500 && statusText === 'clientError')
		return await cb(result)
	if (result.status >= 500 && result.status < 600 && statusText === 'serverError')
		return await cb(result)
	if (result.status >= 400 && result.status < 600 && statusText === 'error')
		return await cb(result)
}
