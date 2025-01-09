export interface StateGet<Props extends Record<PropertyKey, any>> {
	/** All keys crawled */
	keys: PropertyKey[]
	/** Current key */
	key: PropertyKey

	/** Prop */
	props: Props
	/** Parent; previous state that called `crawl(key)` if any */
	parent?: StateGet<Props> | StateApply<Props>

	/**
	 * Returns the proxy crawler, with or without the new provided key
	 *
	 * @example // return a function to be called that replaces current key, with other key
	 * return function fn(str: string) { return crawl(str) }
	 */
	crawl: (key: PropertyKey | PropertyKey[]) => Record<PropertyKey, any> & ((...args: any[]) => any)
}

export interface StateApply<Props extends Record<PropertyKey, any>> {
	/** Arguments provided to the function */
	args: any[]
	/** All keys crawled, including the key being called upon */
	keys: PropertyKey[]
	/** Current key */
	key: PropertyKey

	/** Prop */
	props: Props
	/** @note the immediate parent is the `StateGet`, don't let that take you off-guard.
	 * 
	 * Parent; previous state that called `crawl(key)` if any
	*/
	parent?: StateGet<Props> | StateApply<Props>

	/**
	 * Returns the proxy crawler, with or without the new provided key
	 *
	 * @example // return a function to be called that replaces current key, with other key
	 * return function fn(str: string) { return crawl(str) }
	 */
	crawl: (key: PropertyKey | PropertyKey[]) => Record<PropertyKey, any> & ((...args: any[]) => any)
}

export interface CrawlHandler<Props extends Record<PropertyKey, any> = {}> {
	/**
	 * Match keys in brackets inside key-strings?
	 *
	 * Ex. `some.nested['key[0]["name"]']` is the same as `some.nested.key[0].name`
	 * @default false
	 */
	matchStringedKeys?: boolean

	/**
	 * Convert keys to numbers. Doing `new Proxy()[4]` the key `4` will be interpreted as a string; `"4"`.
	 *
	 * This option converts anything that tests as ONLY a number `/^[0-9]+$/`, to a number.
	 *
	 * 	@default false
	 */
	numberedKeys?: boolean

	/**
	 * Allow `return state.crawl([])` resulting in no keys
	 *
	 * Note: `key` is `Propertykey`, but this makes it `PropertyKey | undefined` - just not typed.
	 */
	allowNoKeys?: boolean

	/** Do `return crawl(key)` to resume normal behaviour */
	get?(state: StateGet<Props>): any
	apply?(state: StateApply<Props>): any

	/** Fake `instanceof` by providing a different class prototype at `getPrototypeOf` */
	getPrototypeOf?(state: {
		/** All keys crawled */
		keys: PropertyKey[]
	}): any
}

const lastBracketRegEx = /(.+)\[([^[\]]+)\]$/
const isNumber = /^[0-9]+$/

/**
 * Allows you to get positional arguments
 * 
 * @example
 * 
 * const crawl = proxyCrawl({ 
 *     apply: (state) => [...state.keys, ...args] 
 * })
 * 
 * const result = crawl.here.we.go(123)
 * console.log(result) // ['here', 'we', 'go', 123]
*/
export function proxyCrawl<Props extends Record<PropertyKey, any> = {}>(handler: CrawlHandler<Props>) {
	const createCrawler = (keys: PropertyKey[], parent?: StateGet<Props> | StateApply<Props>, nested: string[] = []) => {
		let proxy = {} as Record<PropertyKey, ReturnType<typeof createCrawler>>
		let props = {} as Props

		return new Proxy(function () {}, {
			getPrototypeOf(target) {
				if(handler.getPrototypeOf) {
					return handler.getPrototypeOf({ keys })
				}
				return target.prototype
			},
			get(_, key: PropertyKey) {
				key = handler.numberedKeys === true && isNumber.test(key as string) ? +(key as string) : key as string

				if(handler.matchStringedKeys === true) {
					let match: RegExpMatchArray | null
					let matches: string[] | undefined
					while ((match = String(key).match(lastBracketRegEx))) {
						/** in `crawler['key["array"][0]']` this becomes `key["array"]`, then `key` */
						let property = match[1]
						/** in `crawler['key["array"][0]']` this becomes `0` then `"array"` */
						let bracketed = match[2]

						if (bracketed.startsWith("'") || bracketed.startsWith('"') || bracketed.startsWith("`")) {
							bracketed = bracketed.slice(1, -1)
						}

						matches ??= []
						matches.push(bracketed)

						key = property
					}
					if (matches) {
						nested.push(...matches)
					}
				}

				let next = nested.pop()
				
				// Couldn't use `this` inside `crawl` so we do this
				function getState() { return state }
				
				const state = {
					keys,
					key: key,
					parent,
					props,
					crawl(key) {
						if (next !== undefined) {
							return createCrawler(
								[...keys, ...(Array.isArray(key) ? key : [key])], 
								getState(), 
								[...nested]
							)[next]
						} else {
							return createCrawler(
								[...keys, ...(Array.isArray(key) ? key : [key])],
								getState(), 
								[...nested]
							)
						}
					}
				} satisfies StateGet<Props>

				if (handler.get) {
					return handler.get(state)
				}

				proxy[key] ??= createCrawler([...keys, key], state, [...nested])

				if(next) {
					return proxy[key][next]
				}

				return proxy[key]
			},
			apply(_, thisArg, args) {
				let keysCopy = [...keys]
				let key = keysCopy.pop()!
				key = handler.numberedKeys && isNumber.test(key as string) ? +(key as string) : (key as string)

				if(!handler.allowNoKeys && key === undefined) {
					throw new Error(
						'If you see this, you might have done `return state.crawl([])` in `get`, causing the `state.key` in `apply` to be undefined. To allow this behaviour, please provide `allowNoKeys: true` in the handler proxyCrawl handler.', {
							cause: { keys, key: key, args }
						}
					)
				}

				if (handler.apply) {
					let next = nested.pop()

					// Couldn't use `this` inside `crawl` so we do this
					// deno-lint-ignore no-inner-declarations
					function getState() { return state }

					const state = {
						keys: keysCopy,
						key,
						parent,
						props,
						args,
						crawl(key) {
							if (next !== undefined) {
								return createCrawler(
									[...keysCopy, ...(Array.isArray(key) ? key : [key])], 
									getState(),
									[...nested]
								)[next]
							} else {
								return createCrawler(
									[...keysCopy, ...(Array.isArray(key) ? key : [key])], 
									getState(), 
									[...nested]
								)
							}
						}
					} satisfies StateApply<Props>

					return handler.apply(state)
				}
			}
		}) as Record<PropertyKey, any> & ((...args: any[]) => any)
	}
		
	return createCrawler([])
}