import { RuneAPI } from '.'
import { ErrorPath } from '../errors'
import { getProxyModified, objectProxy } from '../object-proxy.svelte'
import { RuneAPIInstance } from './instance.svelte'

export function createProxyObject(
	instanceproxy: RuneAPI, 
	id: string | number | null,
	instance: RuneAPIInstance
) {
	const item = $derived(id === null ? {} : instanceproxy[id])
	const proxiedObject = objectProxy({
		get ref() {
			return item as Record<PropertyKey, unknown>
		}
	})
	
	const modified = getProxyModified(proxiedObject.proxy)
	const isModified = $derived(!!Object.keys($state.snapshot(modified)).length)

	const actions = {
		post() {
			if(id !== null) {
				throw new Error('Cannot POST an existing item. Use PUT instead.')
			}
			return instance.crud.POST(proxiedObject.target)
		},
		put() {
			if(id === null) {
				throw new Error('Cannot PUT a new item. Use POST instead.')
			}
			return instance.crud.PUT(id, proxiedObject.target)
		},
		patch() {
			if(id === null) {
				throw new Error('Cannot PATCH a new item. Use POST instead.')
			}
			return instance.crud.PATCH(id, proxiedObject.target)
		},
		delete() {
			if(id === null) {
				throw new Error('Cannot DELETE a new item.')
			}
			return instance.crud.DELETE(id)
		},
		get modifications() {
			return modified
		},
		get item() {
			return proxiedObject.target
		},
		get isModified() {
			return isModified
		}
	}

	Object.assign(actions.post, {
		validate(path?: ErrorPath) {
			return instance.crud.POST.validate($state.snapshot(proxiedObject.target), path)
		}
	})

	Object.assign(actions.put, {
		validate(path?: ErrorPath) {
			return instance.crud.PUT.validate($state.snapshot(proxiedObject.target), path)
		}
	})

	Object.assign(actions.patch, {
		validate(path?: ErrorPath) {
			return instance.crud.PATCH.validate($state.snapshot(proxiedObject.target), path)
		}
	})

	return new Proxy(proxiedObject.target, {
		get(target, p, receiver) {
			if (p === '$') {
				return actions
			}
			if (p === '_') {
				return proxiedObject.target
			}
			return proxiedObject.proxy[p]
		},
		set(target, p, newValue, receiver) {
			proxiedObject.proxy[p] = newValue
			return true
		}
	})
}