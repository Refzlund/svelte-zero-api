import { KitRequest } from '../../endpoint-proxy'
import { KitRequestProxy, KitRequestProxyXHR } from '../../endpoint-proxy.type'
import { KitResponse } from '../../server/http'
import { RuneAPIInstance } from './instance.svelte'

type PaginationPromise<T> = 
	| Promise<T[]>
	| KitRequestProxy<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>
	| KitRequestProxyXHR<KitResponse<any, any, T[], true> | KitResponse<any, any, any, false>>

export type PaginatorOptions<T> = {
	/**
	 * How long in `ms` until refetch an already fetched pagination? `-1` is never.
	 * @default -1
	*/
	refetch?: number
	/**
	 * Cooldown before being able to fetch again. If position is changed, this will trigger it into a "loading" stage
	 * @default 0
	 */
	cooldown?: number
	/**
	 * Reset the cooldown to `ms` when the position is changed, if cooldown is active.  
	 * This acts as a "warmup", preventing unnecesary loads when skipping ex. a page.
	 * 
	 * @default 444
	*/
	resetCooldown?: number
} & ({
	/** 
	 * Query parameter for the limit.  
	 * Ex. resulting in `?limit=10` where `10` is the count.
	 * 
	 * @default 'limit'
	*/
	limit?: string
	/**
	 * Query parameter for the beginning of the list.  
	 * Ex. resulting in `?skip=50` where `50` is the current `position` + `count`.
	 * 
	 * @default 'skip'
	*/
	skip?: string
	/**
	 * The amount to increment each step of `paginator.next()` and `paginator.prev()`.  
	 * This therefore, also represents the number in the `limit` query.
	*/
	count: number
	/** Start at `skip`, then `limit` that to `count`  */
	range: (query: Record<string, string>) => PaginationPromise<T>
	/**
	 * If desired; a function that returns a promise which indicates the "total" for
	 * this paginator.
	 * 
	 * For the `range` paginator, it makes sense for the total to be the total amount of items.
	*/
	total?: () => Promise<number>
}
| {
	page: (index: number) => PaginationPromise<T>
	/**
	 * If desired; a function that returns a promise which indicates the "total" for
	 * this paginator.
	 * 
	 * For the `pagae` paginator, it makes sense for the total to be the total paginations available.
	*/
	total?: () => Promise<number>
})

export interface PaginatorConstructorOptions {
	/**
	 * Start position of the paginator.
	*/
	startPosition?: number

	/** 
	 * Override `range` count OR virtual pagination 
	 * where pagination options aren't specified.
	*/
	count?: number

	/**
	 * Will only show list when its available/loaded, rather than providing an empty list.
	 * @default true
	*/
	await?: boolean
}

export class Paginator<T> {
	#instance: RuneAPIInstance<T>
	#options? = $state({}) as PaginatorOptions<T>
	#constructorOpts = $state({}) as PaginatorConstructorOptions

	#await = $derived(this.#constructorOpts?.await ?? true)
	#refetch = $derived(this.#options?.refetch ?? -1)
	#cooldown = $derived(this.#options?.cooldown ?? 0)
	#resetCooldown = $derived(this.#options?.resetCooldown ?? 444)
	#paged = $derived(this.#options && 'page' in this.#options)
	
	/** If using a ranged pagination, this is the count per pagination */
	count = $derived.by(() => {
		let result = this.#options && 'count' in this.#options && this.#options.count
		if(result === undefined || result === false) return -1
		return result
	})

	/** Shared pagination content between Paginators for the same RuneAPI */
	static #shared = new WeakMap<RuneAPIInstance<any>, Array<unknown[]> | unknown[]>()

	/**
	 * a sparse (holey) array of already populated ranges.
	 * 
	 * If pagaintor is paged, index of this array is `T[]`.  
	 * If paginator is ranged, index of this array is `T`.
	*/
	#ranges: Array<unknown[]> | unknown[]
	/** Positions that has been fetched */
	#fetches: number[] = []

	
	/** The current viewing range of the paginator. */
	get list() { return this.#list }
	#list: T[] = $state([])

	/**
	 * All items that has been viewed via this `Paginator`.
	 * 
	 * If you start (current) on ex. `4`, any `prev` will be preprended, 
	 * while any `next` will be appended to the listed array.
	*/
	get listed() { return this.#listed }
	#listed = $state([]) as T[]
	
	/**
	 * Current VIEWED (aka `list`) paginated "position"
	 */
	get position() { return this.#position }
	#position: number = $state(0)

	/** 
	 * The total amount of items. 
	 */
	get total() { return this.#total }
	#total = $state(0)

	/**
	 * Whether the "current" is being loading
	*/
	get isLoading() { return this.#loadingPositions.includes(this.current) }
	#loadingPositions = $state([]) as number[]

	/**
	 * The position that is positioned to. May or may not be visible (unlike `position`).  
	 * If `awaited` is `true`, current is the new page, while position is the page being viewed. 
	*/
	get current() { return this.#current }
	#current = $state(0)

	constructor(...args: [opts: PaginatorConstructorOptions]) {
		this.#instance = args.shift()! as any
		this.#options = this.#instance.options.paginator as PaginatorOptions<T>
		this.#constructorOpts = args[0] ?? {}

		this.#ranges = Paginator.#shared.get(this.#instance)!
		if(!this.#ranges) {
			Paginator.#shared.set(this.#instance, this.#ranges = [])
		}

		this.setPosition(this.#constructorOpts.startPosition ?? 0)
		this.updateTotal()
	}

	#pos(next = 1) {
		if (this.count && !this.#paged) {
			return this.current + (this.count * next)
		}
		return this.current + (1 * next)
	}

	/** Paginate to the right */
	async next() {
		this.setPosition(this.#pos())
	}

	/** Paginate to the left */
	async prev() {
		this.setPosition(this.#pos(-1))
	}

	async preloadNext() {
		this.loadPosition(this.#pos())
	}

	async preloadPrev() {
		this.loadPosition(this.#pos(-1))
	}

	async #virtual(position: number) {
		return this.#instance.list.slice(position, position + 10) as T[]
	}

	async updateTotal() {
		if(this.#options && 'total' in this.#options) {
			this.#total = await this.#options.total?.() ?? 0
		}
	}

	async loadPosition(position: number) {
		if(this.#loadingPositions.includes(position)) return

		const promise =
			!this.#options
				? this.#virtual(position)
				: 'page' in this.#options
					? success(this.#options.page(position))
					: success(this.#options.range({
						[this.#options.skip ?? 'skip']: position.toString(),
						[this.#options.limit ?? 'limit']: this.#constructorOpts.count?.toString() ?? this.#options.count?.toString()
					}))

		this.#loadingPositions.push(position)
		await new Promise(resolve => setTimeout(resolve, 1000))
		let result = $state(await promise)
		this.#loadingPositions.splice(this.#loadingPositions.indexOf(position), 1)

		if(!result) return

		if (this.#paged) {
			this.#ranges[position] = result
		} else {
			for (let i = position;i < result.length + position;i++) {
				this.#ranges[i] = result[i - position]
			}
		}

		if (this.position === position) {
			this.#list = result
			this.#instance.set(result)
		}

		return result
	}

	#coolingDown?: Promise<any>
	#coolingReset?: Promise<any>
	#rejectCoolingReset?: () => void

	/** Paginate to a specific position */
	async setPosition(position: number) {
		let _position = this.position
		let _list = this.#list

		this.#current = position

		let range = [] as T[]
		if (this.#paged) {
			range = (this.#ranges[position] ?? []) as T[]
		} else {
			range = this.#ranges.slice(position, position + this.count) as T[]
		}
		if(range.length || !this.#await) {
			this.#position = position
			this.#list = range
		}
		
		if (range.length && this.#refetch === -1) {
			return
		}

		if(this.#refetch >= 0) {
			let lastFetch = this.#fetches[position] ?? 0
			const now = Date.now()

			if (lastFetch + this.#refetch > now)
				return
			else
				this.#fetches[position] = now
		}

		if (this.#cooldown) {
			if (this.#coolingDown || this.#coolingReset) {
				if(this.#resetCooldown > 0) {
					this.#rejectCoolingReset?.()
					this.#coolingReset = new Promise((resolve, reject) => {
						let id = setTimeout(() => {
							resolve(true)
							this.#coolingReset = undefined
							this.#rejectCoolingReset = undefined
						}, this.#resetCooldown)
						this.#rejectCoolingReset = () => {
							clearTimeout(id)
							reject()
						}
					}).catch(() => false)
				}

				try {
					this.#loadingPositions.push(position)
					await this.#coolingDown
					if(!await this.#coolingReset) {
						return
					}
				} catch (error) {
					return
				} finally {
					this.#loadingPositions.splice(this.#loadingPositions.indexOf(position), 1)
				}
			}
			
			this.#coolingDown = new Promise(resolve => setTimeout(() => {
				resolve(true)
				this.#coolingDown = undefined
			}, this.#cooldown))
		}

		let result = await this.loadPosition(position)
		
		if(!result) {
			if (this.current !== position) return

			this.#position = _position
			this.#current = _position
			if(!this.#await) {
				this.#list = _list
			}
			return
		}

		if(this.current === position) {
			this.#position = position
			this.#list = result	
		}
	}
}

function success<T>(item: PaginationPromise<T>) {
	if(item instanceof KitRequest) {
		return item.$.success(({body}) => body as T[])[0]
	}
	return item as Promise<T[]>
}

export function paginatorProxy<T>(instance: RuneAPIInstance<any>) {
	return new Proxy(Paginator, {
		construct(target, argArray) {
			return new target(...[instance, ...argArray] as [any])
		},
	})
}