import type { SSE } from '../server'
import type { EndpointResponse, KitSSE } from '../server/endpoint'
import type { Functions } from '../server/functions.type'

export type ServerType<T extends { GET?; POST?; PUT?; PATCH?; DELETE?; HEAD?; OPTIONS?}> = ({
	[K in keyof T as T[K] extends EndpointResponse<infer I> ? [Extract<I, SSE>] extends [never] ? K : never : never]: T[K] extends (...args: any[]) => {
		use: infer U
	} ? U : never
})
	& (T extends { PATCH: (...args: any[]) => { use(): infer K } } ? K extends Functions<any> ? K : {} : {})
	& (T extends { GET: (...args: any[]) => { use(options?: infer R): infer K } } ? K extends KitSSE<any> ? {
		SSE(options?: R): K
	} : {} : {})

export { createAPIProxy, getMethod, getUrl, fromUrl, Endpoint, APIProxy } from './api-proxy'