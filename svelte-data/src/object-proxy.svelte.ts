import { untrack } from 'svelte'

const IS_PROXY = Symbol('sveltekit-zero-api.objectproxy')
const DELETE_KEY = Symbol('sveltekit-zero-api.objectproxy.delete')

const PARENT = Symbol('sveltekit-zero-api.objectproxy.parent')
const KEY = Symbol('sveltekit-zero-api.objectproxy.key')

const GET_MODIFIED = Symbol('sveltekit-zero-api.objectproxy.getmodified')

/** Gets the root */
export function getProxyModified(object: ObjectProxy) {
	return object[GET_MODIFIED] as Record<PropertyKey, unknown>
}

export type ObjectProxy<T extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>> = T & {
	[IS_PROXY]: true
}

function proxify(value: unknown) {
	return typeof value === 'object'
		&& value !== null
		&& !value[IS_PROXY]
		&& (Array.isArray(value) || String(value).endsWith('Object]'))
}

type TObject = Array<unknown> | Record<PropertyKey, unknown>

/**
 * A proxy that structurally clones a reference, 
 * and tracks modification to that reference.
 * 
 * When the reference changes, the content is updated,
 * but the modified content won't be overriden.
*/
export function objectProxy<T extends Record<PropertyKey, unknown>>(input: {
	/** ergo. { get ref() { return ... } } */
	readonly ref: T 
}) {
	const modified = $state({}) as T

	const combined = $derived.by(() => {
		let result = $state(structuredClone($state.snapshot(input.ref || {}))) as TObject
		untrack(() => {
			function recursive(mod: TObject, value: TObject) {
				for (const key in mod) {
					const item = mod[key]
					if (typeof item === 'object' && item && (Array.isArray(item) || String(item).endsWith('Object]'))) {
						if(!('key' in value)) {
							const state = $state(Array.isArray(item) ? [] : {})
							value[key] = state
						}
						recursive(item as TObject, value[key] as TObject)
						continue
					}
					const a = value[key], b = mod[key]
					if (a === b)
						delete mod[key]
					else
						value[key] = b
				}
			}
			recursive(modified, result)
		})

		return result
	})

	/** Compares the value, to the ref-value at given path */
	function compare(value: unknown, path: PropertyKey[]) {
		let refValue = input.ref as any
		for (const p of path) {
			refValue = refValue?.[p]
			if (refValue === undefined)
				break
		}

		if (value instanceof Date && refValue instanceof Date) {
			return value.valueOf() === refValue.valueOf()
		}

		return value === refValue
	}

	/** Sets the value, to the modified object at a given path */
	function modify(value: unknown, path: string[]) {
		const lastKey = path.pop()!

		let parent = modified as any
		for (let i = 0; i < path.length; i++) {
			const p = path[i]

			if(!parent[p]) {
				const key = path[i + 1] ?? lastKey
				const state = $state(Object.assign(/[1-9]+[0-9]*/.test(key) ? [] : {}, { [PARENT]: parent, [KEY]: p }))
				parent[p] = state
			}
			parent = parent[p]
		}

		if (value === DELETE_KEY) {
			delete parent[lastKey]

			let key: PropertyKey
			while (
				(key = parent[KEY])
				&& Object.keys(parent[PARENT]![key]).length === 0
			) {
				parent = parent[PARENT]!
				delete parent[key]
			}
			return
		}

		parent[lastKey] = value
	}

	function makeProxy(obj: { target: TObject, proxies: Record<string, TObject> }, path: string[]) {
		for(const key in obj.target) {
			const value = obj.target[key]

			if (proxify(value)) {
				makeProxy(value as typeof obj, [...path, key])
			} 
			else if (!compare(value, [...path, key])) {
				modify(value, [...path, key])
			}
			obj.target[key] = value
		}

		const proxy = new Proxy(obj.target, {
			get(target, p) {
				if (p === IS_PROXY) return true
				if (p === GET_MODIFIED) return modified

				if(typeof p === 'symbol') return obj.target[p]
				
				let value = obj.proxies[p] ?? obj.target[p]
				if (proxify(value)) {
					value = makeProxy({
						get target() {
							return value
						},
						proxies: {}
					}, [...path, p]).proxy
					obj.proxies[p] = value
				}

				return value
			},
			set(target, p, value) {
				if (typeof p === 'symbol') {
					obj.target[p] = value
					return true
				} 

				if (proxify(value)) {
					modify(DELETE_KEY, [...path, p])

					const v = $state(value)
					obj.target[p] = v 
					value = makeProxy({
						get target() {
							return v
						},
						proxies: {}
					}, [...path, p]).proxy
					obj.proxies[p] = value
				}
				else {
					if (compare(value, [...path, p]))
						modify(DELETE_KEY, [...path, p])
					else
						modify(value, [...path, p])
				}
				obj.target[p] = value

				return true
			}
		})

		return {
			get proxy() {
				return proxy
			},
			get target() {
				return obj.target
			}
		}
	}

	return makeProxy({
		get target() {
			return combined
		},
		proxies: {}
	}, []) as {
		/** Reference this to when making bindings, tracking changes */
		proxy: ObjectProxy<T>,
		/** Reference this, for reactivity to the object, as the proxy can't do that. */
		target: ObjectProxy<T>
	}
}

