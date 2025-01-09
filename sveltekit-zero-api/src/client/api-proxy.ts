import { browser } from '$app/environment'
import { ServerType } from '.'
import { createEndpointProxy } from '../shared/endpoint-proxy'
import { Endpoint as _Endpoint } from '../server/endpoint'
import { parseResponse } from '../utils/parse-response'
import { proxyCrawl } from '../utils/proxy-crawl'
import { complexSlug } from '../utils/slugs'
import { SSE } from './sse.svelte'

export interface APIProxyOptions {
	/**
	 * Where to fetch from. When `undefined`; the current site.
	 * @default undefined
	 */
	url?: string | URL
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const URL_SYMBOL = Symbol('sveltekit-zero-api.url')
const METHOD_SYMBOL = Symbol('sveltekit-zero-api.method')
const FROM_URL_SYMBOL = Symbol('sveltekit-zero-api.from-url')

/** api... instanceof APIProxy */
export class APIProxy {
	constructor() {
		throw new Error('Please use `createAPIProxy` instead.')
	}
}
export interface APIProxy {
	[key: string]: APIProxy | ((...args: any[]) => APIProxy) | ServerType<any>
}

/** api...GET instanceof Endpoint */
export class Endpoint { }
export interface Endpoint extends _Endpoint { }


/** api...GET.xhr instanceof EndpointXHR */
export class EndpointXHR extends Endpoint { }
type TEndpointXHR = _Endpoint['xhr']
export interface EndpointXHR extends TEndpointXHR { }


export function getUrl(path: APIProxy | Endpoint) {
	return path[URL_SYMBOL]()
}

export function getMethod(path: Endpoint) {
	return path(METHOD_SYMBOL)
}

export const genericAPI = createAPIProxy()

export function fromUrl<
	E extends Record<string, Endpoint> = Record<typeof METHODS[number], Endpoint>
>(api: APIProxy, url: string | URL): E

export function fromUrl<
	E extends Record<string, Endpoint> = Record<typeof METHODS[number], Endpoint>
>(url: string | URL): E

export function fromUrl(api: APIProxy | string | URL, url?: string | URL) {
	if (typeof api === 'string' || api instanceof URL) {
		// Use generic
		url = api
		api = genericAPI
	}
	else if (typeof url !== 'string' && !(url instanceof URL)) {
		throw new Error('`url` must be a string, got: ' + url)
	}

	const _api = api as any
	return _api[FROM_URL_SYMBOL](url) as Record<typeof METHODS[number], _Endpoint>
}

/** api.some.route.GET() */
export function createAPIProxy<T extends APIProxy>(options: APIProxyOptions = {}) {
	return proxyCrawl({
		getPrototypeOf(state) {
			const last = state.keys[state.keys.length - 1]
			if (METHODS.includes(last as any))
				return Endpoint.prototype

			const secondLast = state.keys[state.keys.length - 2]
			if (last === 'xhr' && METHODS.includes(secondLast as any))
				return EndpointXHR.prototype

			return APIProxy.prototype
		},
		apply(state) {
			if (state.key === 'toString' || state.key === Symbol.toPrimitive) {
				return 'APIProxy'
			}

			if (state.key === FROM_URL_SYMBOL) {
				return state.crawl([FROM_URL_SYMBOL, ...state.args])
			}

			let key = state.key.toString()
			if (key.endsWith('$')) {
				// * Slugged route

				let m: RegExpMatchArray | null
				if (key.startsWith('$')) {
					// "$slug$": (slug?: string | undefined | null)
					return state.crawl(state.args[0])
				}
				if (key.endsWith('$$')) {
					// "rest$$": (...rest: string[])
					if (state.args[0] === undefined) {
						throw new Error('Cannot slug the lack of rest parameters', {
							cause: state,
						})
					}
					return state.crawl(state.args)
				}
				if ((m = key.match(complexSlug))) {
					//"[a]-[b]$": (a: string, b: string)
					let result = ''

					let k = key
					let i = 0
					do {
						result += k.slice(0, m.index!)

						if (state.args[i] === undefined) {
							throw new Error('Not enough paramters for complex slug', {
								cause: {
									state,
									result,
									argCount: state.args.length,
									slug: key,
									expected: Array.from(key.matchAll(complexSlug)).length,
								},
							})
						}

						result += state.args[i]
						k = k.slice(m[0].length + m.index!)
						i++
					} while ((m = k.match(complexSlug)))
					result += k.slice(0, -1)

					return state.crawl(result) // ex. `shiba-giraffe`
				}

				// "slug$": (slug: string)
				if (state.args[0] === undefined) {
					throw new Error('Cannot slug undefined', { cause: state })
				}
				return state.crawl(state.args[0])
			}


			// * -- Request Information --

			const xhr = key === 'xhr' && browser ? new XMLHttpRequest() : undefined

			/** Is method (endpoints) or function (funcitons) */
			const isMethod = xhr || METHODS.includes(key as any)

			const requestInit: RequestInit & { query?: Record<string, any> } = isMethod
				? state.args[1] || {}
				: {}

			const searchParams: URLSearchParams | undefined | false =
				'query' in requestInit && new URLSearchParams(requestInit.query)

			const route = state.keys[0] === FROM_URL_SYMBOL
				? undefined
				: xhr
					? state.keys.slice(0, -1).join('/')
					: state.keys.join('/')

			const url = state.keys[0] === FROM_URL_SYMBOL ? state.keys[1].toString() :
				options.url?.toString() ||
				'/' + route + (searchParams ? '?' + searchParams.toString() : '')

			const method = (
				isMethod
					? xhr
						? state.keys[state.keys.length - 1].toString()
						: key
					: 'PATCH'
			) as typeof METHODS[number] // functions always use PATCH

			if (!METHODS.includes(method)) {
				throw new Error('Invalid method: ' + method, { cause: state })
			}

			// * ---------

			if (state.key === URL_SYMBOL) {
				return url
			}

			if (state.args[0] === METHOD_SYMBOL) {
				return method
			}

			if (!browser) {
				// Only browser/client can make fetch requests.
				// On the server utilize the `.use` functionality.
				return state.crawl([])
			}

			// * Both functions and normal API calls requests a response.

			if (key === 'SSE') {
				return SSE(url)
			}

			

			type BodyType =
				| null
				| undefined
				| ReadableStream
				| FormData
				| object
				| string

			let body: BodyType | Array<unknown> =
				isMethod ? state.args[0]
					: state.args[0] instanceof FormData || state.args[0] instanceof ReadableStream ? state.args[0] : state.args

			let headers = new Headers(requestInit?.headers)
			headers.append('x-requested-with', 'sveltekit-zero-api')

			if (key === 'GET' && !headers.has('cache-control'))
				headers.append('cache-control', 'public, max-age=604800, immutable')

			if (body !== null && body !== undefined && !headers.has('content-type')) {
				if (body instanceof ReadableStream) {
					// https://caniuse.com/mdn-api_request_duplex - largely unsupported still
					// headers.set('content-type', 'application/octet-stream')
					throw new Error(
						'Streaming data is largely unsupported in browsers, as Request Duplex is required. See ' +
						'https://caniuse.com/mdn-api_request_duplex'
					)
				} else if (body instanceof FormData) {
					// https://stackoverflow.com/a/49510941 - fetch sets content-type automatically incl. form boundary
					// headers.set('content-type', 'multipart/form-data')
				} else if (
					typeof body === 'object' ||
					typeof body === 'string' ||
					typeof body === 'number' ||
					typeof body === 'boolean'
				) {
					headers.set('content-type', 'application/json')
					body = JSON.stringify(body)
				}
			}

			if (!isMethod) {
				headers.append('x-function', key)
			}

			const abortController = xhr ? undefined : new AbortController()
			const abort = () =>
				xhr ? xhr.abort() : abortController!.abort('Aborted request.')

			// ('query' in requestInit ? '?' + new URLSearchParams(requestInit.query).toString() : '')
			let response =
				!xhr &&
				fetch(
					url,
					// avoid making the "preflight http request", which will make it twice as fast
					method === 'GET'
						? abortController
							? { signal: abortController.signal }
							: undefined
						: {
							...requestInit,
							body: (body === null ? undefined : body) as BodyInit,
							headers,
							method,
							signal: abortController ? abortController.signal : undefined,
						}
				)

			if (isMethod && xhr) {
				// Use XHR

				let xhrResolve: (response: Response) => void
				response = new Promise((resolve, reject) => {
					xhrResolve = resolve
				})

				setTimeout(() => {
					xhr.dispatchEvent(new CustomEvent('init'))

					xhr.open(method, url, true)

					for (const [key, value] of headers) {
						xhr.setRequestHeader(key, value)
					}

					let aborted = false
					xhr.addEventListener('abort', () => (aborted = true), { once: true })

					function onloadend() {
						if (aborted) {
							throw 'Aborted request.'
						}

						const headers = new Headers()
						xhr!
							.getAllResponseHeaders()
							.trim()
							.split(/[\r\n]+/)
							.forEach((line) => {
								const parts = line.split(': ')
								const header = parts.shift()
								const value = parts.join(': ')
								if (header) headers.append(header, value)
							})
						
						xhrResolve(
							new Response(xhr!.response, {
								status: xhr!.status,
								statusText: xhr!.statusText,
								headers,
							})
						)
					}

					xhr.addEventListener('load', onloadend, { once: true })
					xhr.send(body as XMLHttpRequestBodyInit | Document | null | undefined)
				}, 0)
			}

			if (response === false)
				throw new Error('Response was not created correctly') // type narrowing

			response = response
				.catch(async (res) => {
					if (typeof res !== 'object') throw res
					if (!('headers' in res)) throw res
					return res as Response
				})
				.then(parseResponse)

			if (isMethod) {
				return createEndpointProxy(response, abort, xhr)
			}

			return new Promise((resolve, reject) => {
				response
					.then((res) => {
						if (!res.ok) {
							return reject(res)
						}
						resolve(res.body)
					})
					.catch(reject)
			})
		}
	}) as T
}
