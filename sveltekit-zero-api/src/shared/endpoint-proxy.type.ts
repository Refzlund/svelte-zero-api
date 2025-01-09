import type { KitResponse, StatusCode, Statuses, StatusTextType } from '../server/http'
import { StatusCodeType } from '../server/http'
import type { AwaitAll, IfAny, IsAny, Promisify, AnyAsUnknownAll } from '../utils/types'

/**
IfAny<Results, {}, {
		[K in StatusText]: <A extends [Returned] extends [never] ? void : any>(
			cb: (response: Results extends KitResponse<infer A, K, infer C> ? Results : never) => A
		) => EndpointProxy<Results, [Returned] extends [never] ? never : [...Returned, Promisify<A | undefined>]>
	}> 
 */

type ProxyCallback<
	Results extends KitResponse,
	StatusText extends StatusTextType,
	Returned extends Promisify<any>[] = never
> =
	// Only provide callbacks to the KitResponse's we know are there, otherwise none at all.
	('anystring' extends StatusText
		? {}
		: {
			[K in StatusText]: <A extends [Returned] extends [never] ? void : any>(
				cb: (response: Results extends KitResponse<infer A, K, infer C> ? Results : never) => A
			) => KitRequestProxy<
				Results,
				[Returned] extends [never] ? never : [...Returned, Promisify<A | undefined>]
			>
		}) &
	([Returned] extends [never]
		? {
			$: KitRequestProxy<Results, []>
		}
		: {})

type xhrEvents =
	| 'xhrAbort'
	| 'uploadAbort'
	| 'xhrError'
	| 'uploadError'
	| 'xhrLoad'
	| 'uploadLoad'
	| 'xhrLoadend'
	| 'uploadLoadend'
	| 'xhrLoadstart'
	| 'uploadLoadstart'
	| 'xhrProgress'
	| 'uploadProgress'
	| 'xhrTimeout'
	| 'uploadTimeout'

/**
 * A shortcut to `KitRequestProxy<..., never, true>`
*/
export type KitRequestProxyXHR<Results extends KitResponse> = KitRequestProxy<Results, never, true>

/**
 * An `KitRequestProxy` return type, that can be proxy-crawled
 * to do `.OK(...).$.error(...)` etc.
 * 
 * @param Results - The typed responses from this endpoint
 * @param Returned - An array of the returned promises resulting from chaining `.$.`
 * @param XHR - Whether the request uses fetch (`false`) or XHR (`true`)
 */
export type KitRequestProxy<
	Results extends KitResponse,
	Returned extends Promise<any>[] = never,
	XHR extends boolean = false
> =
	// Promise<KitResponse>     $:  Promise<[...any[]]>
	Promise<[Returned] extends [never] ? Results : AnyAsUnknownAll<AwaitAll<Returned>>> &
	// $:  [...Promise<any>[]]
	([Returned] extends [never] ? {} : Returned) &
	// Callback chain of Response types (.OK, .BadRequest ...)
	([Results] extends [KitResponse<infer _, infer StatusText>]
		? ProxyCallback<Results, StatusText extends StatusTextType ? StatusText : never, Returned>
		: {}) & {
		// Callback chain of Response statuses (.success, .clientError ...)
		[K in 'any' | keyof Statuses]: <A extends [Returned] extends [never] ? void : any>(
			cb: (
				response: Results extends KitResponse<
					K extends 'any' ? StatusCodeType : StatusCode[Statuses[Exclude<K, 'any'>]]
				>
					? Results
					: never
			) => A
		) => KitRequestProxy<
			Results,
			[Returned] extends [never] ? never : [...Returned, Promise<A | undefined>]
		>
	} & {
		/** Send AbortSignal */
		abort: () => void
	} & (XHR extends true
		? [Returned] extends [never]
		? {
			[K in xhrEvents]: (
				callback: (event: ProgressEvent, xhr: XMLHttpRequest) => void
			) => KitRequestProxy<Results, never, true>
		} & {
			/**
			 * When only `const xhr = new XMLHttpRequest()` has been established.
			 *
			 * Before `xhr.open(method, url, true)`
			 */
			xhrInit: (callback: (xhr: XMLHttpRequest) => void) => KitRequestProxy<Results, never, true>
			xhrReadystatechange: (
				callback: (event: Event, xhr: XMLHttpRequest) => void
			) => KitRequestProxy<Results, never, true>
			uploadReadystatechange: (
				callback: (event: Event, xhr: XMLHttpRequest) => void
			) => KitRequestProxy<Results, never, true>
		}
		: {}
		: {})
