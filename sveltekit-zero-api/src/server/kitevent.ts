import type { Handle, RequestEvent } from '@sveltejs/kit'
import { BadRequest, KitResponse } from './http'
import type { Callback, EndpointCallbackResult } from './endpoint'
import type { MaybePromise, Simplify, UnionToIntersection } from '../utils/types'
import type { ZeroAPIServerOptions } from './hooks'

export interface KitEvent<
	Input extends {
		body?: unknown
		query?: Record<string | number, any>
	} = any,
	Results = any
> extends RequestEvent {
	body: [Input['body']] extends [never] ? unknown : Input['body']
	query: [Input['query']] extends [never] ? Record<string | number, unknown> : Input['query']
	/**
	 * Returned content from previous callbacks in an endpoint;
	 * `App.Locals` little brother.
	 */
	results: [Results] extends [never] ? Record<PropertyKey, unknown> : Results
	zeroAPIOptions: ZeroAPIServerOptions
}

type T = Awaited<ReturnType<ParseKitEvent<{ body?, query?}>['fn']>>

/**
 * A helper function to create a KitEvent from the results
 * of endpoint functions.
 */
export type KitEventFn<
	R1 extends Callback | ParseKitEvent<{}>,
	R2 extends Callback | ParseKitEvent<{}> = never,
	R3 extends Callback | ParseKitEvent<{}> = never,
	R4 extends Callback | ParseKitEvent<{}> = never,
	R5 extends Callback | ParseKitEvent<{}> = never,
	R6 extends Callback | ParseKitEvent<{}> = never,
	R7 extends Callback | ParseKitEvent<{}> = never
> = KitEvent<
	Exclude<Awaited<
		ReturnType<
			Extract<R1 | R2 | R3 | R4 | R5 | R6 | R7, ParseKitEvent<any>>['fn']
		>
	>, KitResponse<any, any>>,
	UnionToIntersection<Awaited<ReturnType<Exclude<R1 | R2 | R3 | R4 | R5 | R6 | R7, ParseKitEvent<any> | KitResponse<any, any>>>>>
> extends KitEvent<infer A, infer B>
	? KitEvent<A, B>
	: never

/**
 * Provides the `body` and `query` properties from the `KitEvent` with types
 * 
 * @example
```ts
import {
	type KitEvent,
	ParseKitEvent
} from 'sveltekit-zero-api'

function zod({ body, query }) {
	return new ParseKitEvent((event => {
		let json

		try {
			json = await event.request.json()
		} catch (error) {
			return new BadRequest({
				code: 'invalid_json',
				error: 'Invalid JSON'
			})
		}
		const [bodyResult, queryResult] = [
			body && body.safeParse(json),
			query && query.safeParse(
				ParseKitEvent.queryParse(event)
			)
		]
		
		if(bodyResult !== undefined && !bodyResult.success) {
			return new BadRequest({
				code: 'invalid_body_schema',
				error: bodyResult.error
			})
		}

		if(queryResult !== undefined && !queryResult.success) {
			return new BadRequest({
				code: 'invalid_query_schema',
				error: queryResult.error
			})
		}

		return {
			body: bodyResult.data,
			query: queryResult.data
		}
	}), zodToJsonSchema(body))
}

```
*/
export class ParseKitEvent<Result extends { body?: any, query?: any } | KitResponse<any, any> = {}> {
	fn: (event: KitEvent) => MaybePromise<Result>
	/** The `schema` is sent to frontend to be reconstructed as a validator. */
	schema?: Record<string, any>

	constructor(
		fn: (event: KitEvent) => MaybePromise<Result>,
		jsonSchema?: typeof this.schema
	) {
		this.fn = fn
		this.schema = jsonSchema
	}

	extend<ExtendeResult extends { body?: any, query?: any } | KitResponse<any, any>>(
		fn: (body: Exclude<Result, KitResponse<any, any>>['body'], query: Exclude<Result, KitResponse<any, any>>['query']) => MaybePromise<ExtendeResult>,
		schema?: typeof this.schema
	) {
		type R = Extract<Result, KitResponse<any, any>>
		return new ParseKitEvent<
			ExtendeResult | R
		>(async (event) => {
			let result = await this.fn(event)
			if (result instanceof KitResponse) return result
			return fn(result.body!, result.query ?? event.query) as any
		}, schema || this.schema)
	}
}

interface FakeOptions {
	/**
	 * Provide your server hooks.
	 *
	 * Remember to [Sanitize](https://docs.deno.com/runtime/fundamentals/testing/#resource-sanitizer)
	 * after your tests, like closing database-connections.
	 */
	hooks?: Handle
	/** Pre-fill locals, e.g. `isTest: true` */
	locals?: Record<PropertyKey, any>

	params?: Record<PropertyKey, any>
	platform?: Record<PropertyKey, any>
	requestInit?: RequestInit
}

/**
 * Emulate a SvelteKit RequestEvent (ergo KitEvent) for testing.
 *
 * To check if currnetly processing a test event, you can do
 *
 * @example
 * if(event instanceof FakeKitEvent) {
 *     /// running a test
 * }
 */
export class FakeKitEvent implements KitEvent {
	body = {} as any
	query = {} as any
	fetch = fetch
	request = {} as any
	locals = {} as any
	getClientAddress = () => '127.0.0.1'
	isDataRequest = false
	isSubRequest = false
	params = {}
	platform = {}
	results = {}
	route = {} as any
	setHeaders = {} as any
	url = {} as any
	cookies = {} as any
	zeroAPIOptions = {}

	hooks: Handle | undefined

	constructor(options: FakeOptions = {}) {
		Object.assign(this, options)

		this.request = new Request(new URL('http://localhost:5173'), options.requestInit ?? {})

		// TODO
	}
}
