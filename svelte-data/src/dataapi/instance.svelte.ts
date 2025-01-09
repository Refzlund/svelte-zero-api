import { SvelteMap } from 'svelte/reactivity'
import { RunesDataInstance } from './instance.type'
import { createGroupsProxy } from './instance.groups.svelte'
import { createInstanceCRUD } from './instance.crud'
import { Paginator, paginatorProxy } from './instance.paginator.svelte'

export class RuneAPIInstance<T = unknown> {
	list = $state([]) as unknown[]
	map = new SvelteMap<string | number, unknown>()

	#listeners = {
		set: [],
		remove: []
	} as {
		set: Array<(values: T[]) => void>
		remove: Array<(values: T[]) => void>
	}
	options: RunesDataInstance<unknown>

	discriminator: {
		/** Gets the discriminator from input body */
		get: (body: unknown) => string | false
		/** Create a new entry of body, with a temporary discriminator and returns a revert function */
		temp?: (body: unknown) => () => void
		/** Create a new entry of body, with a new discriminator and returns a revert function */
		set?: (body: unknown) => () => void
	}

	crud: ReturnType<typeof createInstanceCRUD>
	groups?: ReturnType<typeof createGroupsProxy>
	Paginator: Paginator<T>['constructor']

	get fetch() {
		return this.options.fetch
	}
	get api() {
		return this.options.api
	}

	constructor(options: RunesDataInstance<unknown>) {
		this.options = options
		this.discriminator = {} as typeof this.discriminator

		const discriminator = typeof options.discriminator === 'function' ? { get: options.discriminator } : options.discriminator
		this.discriminator.get = discriminator.get

		if ('temp' in discriminator) {
			this.discriminator.temp = (body: unknown) => this.set(discriminator.temp(body))
		}
		if ('set' in discriminator) {
			this.discriminator.set = (body: unknown) => this.set(discriminator.set!(body))
		}

		if (options.groups) {
			this.groups = createGroupsProxy(this, options.groups)
		}
		this.crud = createInstanceCRUD(this)

		this.Paginator = paginatorProxy(this)

		options.live?.((body) => this.set(body))
	}

	on(
		event: 'set' | 'remove',
		cb: (values: T[]) => void
	) {
		this.#listeners[event].push(cb)
		return () => {
			const index = this.#listeners[event].indexOf(cb)
			if (index !== undefined && index !== -1) {
				this.#listeners[event].splice(index, 1)
			}
		}
	}

	remove(key: string | number) {
		const item = this.map.get(key) as T
		if(!item) return () => {}

		this.map.delete(key)

		const index = this.list.indexOf(item)
		this.list.splice(index, 1)

		this.#listeners.remove.forEach((cb) => cb([item]))

		/** Revert */
		return () => {
			this.set(item)
		}
	}

	set(value: unknown | unknown[], many?: (state: T) => void) {
		if (Array.isArray(value)) {
			const fns = [] as Function[]

			let items = [] as T[]
			value.forEach((v) => fns.push(this.set(v, state => items.push(state))))
			this.list = [...this.list, ...items]
			this.#listeners.set.forEach((cb) => cb(items))

			/** Revert */
			return () => {
				fns.forEach((fn) => fn())
			}
		}

		const key = this.discriminator.get(value)
		if (key === undefined || key === false || key === null) {
			return () => {}
		}

		if (value === undefined || value === null) {
			return this.remove(key)
		}

		let pre = $state.snapshot(this.map.get(key))
		const state = $state(value) as T

		if(many) {
			// This prevents spamming if `.list` is used within an effect
			many(state)
		} else {
			this.list.push(state)
			this.#listeners.set.forEach((cb) => cb([value as T]))
		}
		this.map.set(key, state)
		/** Revert action */
		return () => {
			if (!pre) {
				this.remove(key)
				return
			}
			this.set(pre)
		}
	}
}