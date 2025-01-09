import { Endpoint } from '../../server/endpoint'
import { EndpointValidator, ErrorPath, KitValidationError } from '../errors'
import { RuneAPIInstance } from './instance.svelte'

export function createInstanceCRUD(instance: RuneAPIInstance<any>) {
	const crud = {
		async GET(key?: string) {
			if (typeof key !== 'undefined') {
				const endpoint = instance.api.id$!(key).GET as Endpoint
				return endpoint.xhr().success(({ body }) => instance.set(body))
			}
			return instance.api.GET?.xhr().success(({ body }) => instance.set(body))
		},
		POST(data: unknown) {
			const endpoint = instance.api.POST as Endpoint
			const revert =
				instance.discriminator.temp
				? instance.discriminator.temp?.(data)
				: instance.discriminator.set 
				? instance.discriminator.set!(data)
				: instance.set(data)

			return endpoint.xhr(data).error(revert).success(({ body }) => {
				if (instance.discriminator.temp) {
					revert()
				}
				instance.set(body)
			})
		},
		async PUT(key: string | number, data: unknown) {
			const endpoint = instance.api.id$!(key).PUT as Endpoint
			const revert = instance.set(data)
			return endpoint.xhr(data).error(revert).success(({ body }) => instance.set(body))
		},
		async PATCH(key: string | number, data: unknown) {
			const endpoint = instance.api.id$!(key).PATCH as Endpoint
			
			// TODO Merge instead of set
			const revert = instance.set(data)
			return endpoint.xhr(data).error(revert)
		},
		async DELETE(key: string | number) {
			const endpoint = instance.api.id$!(key).DELETE as Endpoint
			const revert = instance.remove(key)
			return endpoint.xhr().error(revert)
		}
	} as const

	Object.assign(crud.POST, {
		async validate(data: unknown, path?: ErrorPath) {
			const v = await EndpointValidator.fromEndpoint(instance.api.POST)
			if (!v) return []
			v.validate(data, path)
		}
	})
	Object.assign(crud.PUT, {
		async validate(data: unknown, path?: ErrorPath) {
			const v = await EndpointValidator.fromEndpoint(instance.api.id$!('-').PUT)
			if (!v) return []
			v.validate(data, path)
		}
	})
	Object.assign(crud.PATCH, {
		async validate(data: unknown, path?: ErrorPath) {
			const v = await EndpointValidator.fromEndpoint(instance.api.id$!('-').PATCH)
			if (!v) return []
			v.validate(data, path)
		}
	})

	return crud as typeof crud & {
		POST: { validate(data: unknown, path?: ErrorPath): Promise<KitValidationError[]> },
		PUT: { validate(data: unknown, path?: ErrorPath): Promise<KitValidationError[]> },
		PATCH: { validate(data: unknown, path?: ErrorPath): Promise<KitValidationError[]> }
	}
}