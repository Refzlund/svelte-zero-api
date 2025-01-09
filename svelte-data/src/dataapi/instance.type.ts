import { KitRequestProxy, KitRequestProxyXHR } from '../../endpoint-proxy.type'
import { Endpoint } from '../../server/endpoint'
import { KitResponse } from '../../server/http'
import { Slugged } from '../../utils/slugs'
import { PaginatorOptions } from './instance.paginator.svelte'

export type InstanceAPI<T> = {
	GET?: Endpoint<
		any,
		KitResponse<any, any, T | T[], true> | KitResponse<any, any, any, false>
	>
	POST?
} & Partial<
	Slugged<{
		GET?
		PUT?
		PATCH?
		DELETE?
	}>
>

export type Grouping<T, Sortable extends boolean = true> = {
	filter(...args: Parameters<T[]['filter']>): Grouping<T>
} & (Sortable extends true ? { sort(...args: Parameters<T[]['sort']>): Grouping<T, false> } : {})

export interface RunesDataInstance<T> {
	api: InstanceAPI<T>
	/** If `discriminator` is provided, then elements can be accessed via the that. Ex. `data.users[id]` instead of the index in the list; `data.users[4]` */
	discriminator: ((body: T) => string | false) | {
		/** Get the discriminator from within a value */
		get: (body: T) => string | false
	} & ({
		/**
		 * Create a temporary discriminator used on POST, that gets overriden by the response discriminator.
		 * 
		 * This allows the data to get instantly updated.
		 * 
		 * @example
		 * temp: (body) => {
		 *    body.id = ...
		 *    return body
		 * }
		*/
		temp: (body: T) => T
	} | {
		/**
		 * Create a discriminator, and add it to the body before data is sent on POST.
		 * 
		 * This allows the data to get instantly updated.
		 * 
		 * @example
		 * set: (body) => {
		 *    body.id = ...
		 *    return body
		 * }
		*/
		set: (body: T) => T
	})
	/**
	 * If `fetch` is `true` the list will get fetched when referenced the first time.
	 * 
	 * If it's a `number` (milliseconds), it will wait until that amount of time has passed, until it fetches again.
	 * 
	 * This is true for both when retrieving values like iteration; `{#each data.users as user}` and single items; `data.users[id]`
	*/
	fetch?: boolean | number
	live?(subscribe: (body: T | T[]) => void): void
	paginator?: PaginatorOptions<T>
	/** The groups filtering/sorting first happens when accessed */
	groups?: Record<string, (list: Grouping<T>) => Grouping<T, boolean>>
}