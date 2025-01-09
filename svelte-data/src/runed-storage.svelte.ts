export function runedStorage<T>(key: string, defaultValue: T, stringify: (v: T) => string, parse: (v: string) => T) {
	if (typeof localStorage === 'undefined') return { value: defaultValue }
	const item = localStorage.getItem(key)
	let value = $state(item === null ? defaultValue : parse(item))
	$effect(() => { localStorage.setItem(key, stringify(value)) })
	return {
		value
	}
}

export function runedObjectStorage<T extends Record<PropertyKey, unknown>>(key: string, defaultValue: T) {
	return runedStorage<T>(key, structuredClone(defaultValue), JSON.stringify, JSON.parse).value as T
}

export function runedSession<T>(key: string, defaultValue: T, stringify: (v: T) => string, parse: (v: string) => T) {
	if (typeof sessionStorage === 'undefined') return { value: defaultValue }
	const item = sessionStorage.getItem(key)
	let value = $state(item === null ? defaultValue : parse(item))
	$effect(() => { sessionStorage.setItem(key, stringify(value)) })
	return {
		value
	}
}

export function runedSessionObjectStorage<T extends Record<PropertyKey, unknown>>(key: string, defaultValue: T) {
	return runedSession<T>(key, structuredClone(defaultValue), JSON.stringify, JSON.parse).value as T
}