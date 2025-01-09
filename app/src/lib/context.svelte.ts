import { getContext, setContext } from 'svelte'

export function createContext<T>(
	name: string
) {
	return {
		set(context: T) {
			setContext(name, context)
		},
		get(): T {
			return getContext(name)
		}
	}
}