import { Endpoint } from '../../server/endpoint'
import { Slugged } from '../../utils/slugs'
import { DeepPartial } from '../../utils/types'
import {
	ErrorPath,
	KitValidationError,
	ValidatedKitRequestXHR,
} from '../errors'
import { Paginator, PaginatorConstructorOptions } from './instance.paginator.svelte'

type Input<P extends Endpoint> = P extends Endpoint<infer Input> ? Input : never

interface Create<T, P extends Endpoint> {
	post: {
		(data: Input<P>['body']): ValidatedKitRequestXHR<ReturnType<P['xhr']>>
		validate(data: unknown, path?: ErrorPath): Promise<KitValidationError[]>
	}
	create(): T & {
		$: {
			/** Do NOT bind to this, as it won't track changes. */
			readonly item: T
			readonly isModified: boolean
			/** The modifications to the item */
			readonly modifications: DeepPartial<T>
			post: {
				(): ValidatedKitRequestXHR<ReturnType<P['xhr']>>
				validate(path?: ErrorPath): Promise<KitValidationError[]>
			}
		}
	}
}

/** Gets the endpoint function for a slugged route of key */
type GetSluggedEndpointFn<T, Key extends string> = T extends {
	[Slug in `${string}$`]: (...args: any[]) => { [K in Key]: infer V }
}
	? V extends Endpoint
	? V
	: never
	: never

type Modify<T, Put extends Endpoint, Patch extends Endpoint, Delete extends Endpoint> = [
	Put,
	Patch
] extends [never, never] ? {} :
	& {
		modify(id: string): T & {
			$: {
				/** Do NOT bind to this, as it won't track changes. */
				readonly item: T
				readonly isModified: boolean
				/** The modifications to the item */
				readonly modifications: DeepPartial<T>
			}
			& ([Put] extends [never] ? {} : {
				put: {
					(): ValidatedKitRequestXHR<ReturnType<Put['xhr']>>
					validate(path?: ErrorPath): Promise<KitValidationError[]>
				}
			})
			& ([Patch] extends [never] ? {} : {
				patch: {
					(): ValidatedKitRequestXHR<ReturnType<Patch['xhr']>>
					validate(path?: ErrorPath): Promise<KitValidationError[]>
				}
			})
			& ([Delete] extends [never] ? {} : { delete(): ReturnType<Delete['xhr']> })
		}
	}
	& ([Put] extends [never] ? {} : {
		put: {
			(id: string | number, data: Input<Put>['body']): ValidatedKitRequestXHR<ReturnType<Put['xhr']>>
			validate(data: unknown, path?: ErrorPath): Promise<KitValidationError[]>
		}
	})
	& ([Patch] extends [never] ? {} : {
		patch: {
			(id: string | number, data: Input<Patch>['body']): ValidatedKitRequestXHR<ReturnType<Patch['xhr']>>
			validate(data: unknown, path?: ErrorPath): Promise<KitValidationError[]>
		}
	})
	& ([Delete] extends [never] ? {} : {
		delete(id: string | number): ReturnType<Delete['xhr']>
	})

export type DataAPI<T, G, A> =
	& {
		[Symbol.iterator](): ArrayIterator<T>
		list: T[]
		entries: MapIterator<[string | number, T]>
		keys: MapIterator<string | number>
		length: number
		has(key: string): boolean
		Paginator: new (options?: PaginatorConstructorOptions) => Paginator<T>
	}
	& (A extends { GET: Endpoint }
		? {
			/** Calls GET */
			get(): Promise<T[]>
		} : {})
	& (A extends { POST: Endpoint } ? Create<T, A['POST']> : {})
	& (A extends Slugged<{ GET: infer P }>
		? P extends Endpoint
		? {
			/** Calls id$(...).GET */
			get(id: string | number): ReturnType<P['xhr']>
		}
		: {}
		: {})
	& (A extends Slugged<{ DELETE: infer P }>
		? P extends Endpoint
		? {
			/** Calls id$(...).DELETE */
			delete(id: string | number): ReturnType<P['xhr']>
		}
		: {}
		: {})
	& Modify<T, GetSluggedEndpointFn<A, 'PUT'>, GetSluggedEndpointFn<A, 'PATCH'>, GetSluggedEndpointFn<A, 'DELETE'>>
	& ([G] extends [never]
		? {}
		: G extends Record<string, any>
		? { groups: Record<keyof G, T[]> }
		: {})
	& {
		[key: string]: T
	}
