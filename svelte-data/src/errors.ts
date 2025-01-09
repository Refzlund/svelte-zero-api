import { Endpoint, getMethod, getUrl, KitRequestXHR } from 'sveltekit-zero-api/client'
import { Promisify } from '../../sveltekit-zero-api/src/utils/types'

export type ErrorPath = string | number | (string | number)[]

export interface KitValidationError {
	error: string
	code: string
	details?: unknown
	path: (string | number)[]
}

export type ValidatedKitRequestXHR<T extends KitRequestXHR = KitRequestXHR> =
	T & Promisify<Awaited<T>, KitValidationError[]>

const path = Symbol('formapi.path')
/** Matches and "caches" path seperated by . */
export function matchPath(obj: KitValidationError, str: string) {
	obj[path] ??= obj.path.join('.')
	return obj[path] === str
}


/** Validates body for an endpoint, based the schema associated with the endpoint. */
export class EndpointValidator {
	static #validationConstructor?: Parameters<typeof EndpointValidator['validationConstructor']>[0]
	
	/** ex. `POST /some/url` */
	static #endpointValidators = new Map<string, EndpointValidator | false>()

	schema?: Record<string, unknown>
	#validate: ReturnType<Parameters<typeof EndpointValidator['validationConstructor']>[0]>['validate']

	constructor(schema: Record<string, unknown>) {
		if (!EndpointValidator.#validationConstructor) {
			throw new Error()
		}

		this.schema = schema
		this.#validate = EndpointValidator.#validationConstructor(this.schema).validate
	}

	validate(data: unknown, path?: ErrorPath) {
		return this.#validate(data, path)
	}

	/** Caches validators from same endpoints, so they don't need to be created again */
	static async fromEndpoint(endpoint: Endpoint) {
		if(!this.constructable)
			return false
		
		const endpointUrl = getUrl(endpoint)
		const endpointMethod = getMethod(endpoint)
		const url = `${endpointMethod} ${endpointUrl}`

		let validator = this.#endpointValidators.get(url)
		if(validator instanceof EndpointValidator) {
			return validator
		}
		
		if(validator === false) {
			return false
		}

		if (validator === undefined) {
			const [err, schema] = await endpoint(null, { headers: { 'x-validation-schema': 'true' } })
				.serverError(res => {
					console.error('Could not retrieve schema for construction of EndpointValidator', res)
				})
				.$.clientError(({ body }) => {
					if (body.code === 'no_validation_schema') {
						return false
					}
				}).success(({ body }) => {
					return body as Record<string, unknown>
				})
			
			if(err === false) {
				this.#endpointValidators.set(url, false)
				return false
			}

			if(!schema) {
				throw new Error('Schema for construction of EndpointValidator did not return 2xx response')
			}

			validator = new EndpointValidator(schema)
			this.#endpointValidators.set(url, validator)
		}

		return validator
	}

	/**
	 * Returns a `validate` function, and a `errors` function that 
	 * is a derivative of errors occurred from `validate`.
	*/
	stateful() {
		const validator = this
		let errors = $state([] as KitValidationError[])
		return {
			validate(data: unknown, path?: ErrorPath) {
				errors = validator.validate(data, path)
				return errors
			},
			errors(path?: ErrorPath) {
				if(!path) {
					return errors
				}
				const derivative = $derived(errors.filter(err => {
					return true // TODO filter based on path
				}))
				return derivative
			}
		}
	}

	static get constructable() {
		return !!EndpointValidator.#validationConstructor
	}

	static validationConstructor(
		validationConstructor: (schema: Record<string, unknown>) => {
			validate: (data: unknown, path?: ErrorPath) => KitValidationError[]
		}
	) {
		this.#validationConstructor = validationConstructor
	}
}

