import type { Endpoint } from '../../server/endpoint'
import type { KitResponse } from '../../server/http'
import { KeyOf } from '../../utils/types'
import { APIProxy } from '../api-proxy'
import { RuneAPI } from './runeapi.type'
import { RuneAPI as _RuneAPI } from '.'
import { Paginator } from './paginator.svelte'
import { runedObjectStorage, runedSessionObjectStorage } from '../runed-storage.svelte'
import { RunesDataInstance } from './instance.type'
import { RuneAPIInstance } from './instance.svelte'



interface RunesAPIOptions<T> {
	/** The ID associated with this runesAPI */
	id: string
	/** Include this query on `api.GET` */
	query?: (state: {
		/** When was the last api.GET request sent? (milliseconds elapsed since midnight, January 1, 1970 — UTC) */
		lastGetRequestAt: number
	}) => Record<string, unknown>
	indexedDB?: {}
	live?: (cb: (data: T) => void) => void
}

export function runesAPI<TItems, TType>(
	instances: TItems & {
		[K in keyof TType]: RunesDataInstance<KeyOf<TType, K>>
	}
): {
		[K in keyof TItems]: RuneAPI<
			KeyOf<TType, K>,
			KeyOf<KeyOf<TItems, K>, 'groups'>,
			KeyOf<KeyOf<TItems, K>, 'api'>
		>
	}

export function runesAPI<TAPI, TItems, TData extends Record<string, any[]>>(
	api: TAPI & {
		GET: Endpoint<
			any,
			KitResponse<any, any, TData, true> | KitResponse<any, any, any, false>
		>
	},
	items: TItems & {
		[Key in keyof TData]?: Pick<
			RunesDataInstance<KeyOf<TData, Key>[number]>,
			'discriminator' | 'groups'
		>
	},
	options?: RunesAPIOptions<TData>
): {
		[K in keyof TItems]: RuneAPI<
			KeyOf<TData, K>[number],
			KeyOf<KeyOf<TItems, K>, 'groups'>,
			KeyOf<TAPI, K>
		>
	}

export function runesAPI(...args: any[]) {
	let getAPI: APIProxy | undefined
	let instances: Partial<Record<string, RunesDataInstance<unknown>>>
	let options: RunesAPIOptions<unknown> | undefined

	if (args[0] instanceof APIProxy) {
		getAPI = args[0]
		instances = args[1]
		options = args[2]
	}
	else {
		instances = args[0]
	}

	const proxies = {} as Record<string, {}>
	const setters = {} as Record<string, (data: any) => void>

	const id = options?.id ?? Math.random().toString(36).slice(2)

	const defaultSession = { lastGetRequestAt: 0 }
	const session = getAPI
		? options?.indexedDB
			? runedObjectStorage(`runesapi-${id}`, defaultSession) 
			: runedSessionObjectStorage(`runesapi-${id}`, defaultSession)
		: defaultSession

	function refresh() {
		if (getAPI) {
			const GET = getAPI.GET as Endpoint
			const opts = (options || {}) as RunesAPIOptions<unknown>

			GET(null, { query: opts.query?.(session) }).success(({ body }) => {
				for (const key in body) {
					const set = setters[key]
					if (!set) continue
					for (const data of body[key]) {
						set(data)
					}
				}
			})

			session.lastGetRequestAt = Date.now()
		}
	}

	for (const key in instances) {
		const instance = new RuneAPIInstance(instances[key]!)
		setters[key] = (data: unknown) => instance.set(data)

		const cooldown = typeof instance.fetch === 'number' ? instance.fetch : 0

		// getAPI will get all items
		let updatedAt = 0
		let itemUpdatedAt: Record<PropertyKey, number> = {}

		proxies[key] = new Proxy({}, {
			getPrototypeOf() {
				return _RuneAPI.prototype
			},
			get(_, property) {
				const update = (
					(instance.fetch === true && updatedAt === 0)
					|| (typeof instance.fetch === 'number' && Date.now() > updatedAt + cooldown)
				)
					&& (
						property === Symbol.iterator
						|| property === 'list'
						|| property === 'entries'
						|| property === 'keys'
						|| property === 'length'
						|| property === 'has'
						|| property === 'groups'
					)

				if (update) {
					updatedAt = Date.now()
					instance.crud.GET()
				}

				switch (property) {
					case Symbol.iterator: return () => instance.list[Symbol.iterator]()
					case 'list': return instance.list
					case 'entries': return () => instance.map.entries()
					case 'keys': return () => instance.map.keys()
					case 'length': return instance.map.size
					case 'has': return (key: string) => instance.map.has(key)

					// CRUD
					case 'get': return instance.crud.GET
					case 'post': return instance.crud.POST
					case 'put': return instance.crud.PUT
					case 'patch': return instance.crud.PATCH
					case 'delete': return instance.crud.DELETE

					// Proxied objects
					case 'modify': return
					case 'create': return

					// Data
					case 'groups': return instance.groups
					case 'Paginator': return Paginator

					// Validation
					case 'validate': return

					case 'toJSON': return () => Array.from(instance.map.values())
					case 'toString': return () => JSON.stringify(Array.from(instance.map.values()))
				}

				// Return list-item based on discriminator

				if (typeof property === 'symbol')
					return instance.map[property]

				const shouldUpdate =
					instance.fetch === true && !instance.map.has(property)
					|| (cooldown > 0 && Date.now() > Math.max(itemUpdatedAt[property] || 0, updatedAt) + cooldown)

				if (shouldUpdate) {
					itemUpdatedAt[property] = updatedAt
					instance.crud.GET(property)
				}

				return instance.map.get(property)
			}
		})
	}

	refresh()

	return proxies
}
