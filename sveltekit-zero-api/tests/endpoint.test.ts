import { test, expect } from 'bun:test'
import { endpoint } from '../src/server/endpoint'
import { BadRequest, KitResponse, OK } from '../src/server/http'
import { FakeKitEvent, type KitEvent, ParseKitEvent } from '../src/server/kitevent'
import { parseJSON } from '../src/server/parsers/parse-json'
import z from 'zod'
import { Generic } from '../src/server/generic'

function zod<Body extends z.ZodTypeAny = never, Query extends z.ZodTypeAny = never>({
	body,
	query
}: {
	body?: Body
	query?: Query
}) {
	return async (event: KitEvent<any, any>) => {
		let result = await parseJSON(event)

		if (result instanceof KitResponse) return result

		const bodyResult = body?.safeParse(result.body)
		if (bodyResult !== undefined && !bodyResult.success) {
			return new BadRequest({
				code: 'invalid_body_schema',
				error: 'Invalid body schema',
				details: bodyResult.error
			})
		}

		const queryResult = query?.safeParse(event.query)
		if (queryResult !== undefined && !queryResult.success) {
			return new BadRequest({
				code: 'invalid_query_schema',
				error: 'Invalid query schema',
				details: queryResult.error
			})
		}

		return new ParseKitEvent<z.output<Body>, z.output<Query>>({
			body: bodyResult?.data,
			query: queryResult?.data
		})
	}
}

test('Generic endpoint', async () => {
	function someEndpoint<Body, Query extends {}>(event: KitEvent<{ body: Body; query: Query }>) {
		return new OK({ body: event.body, query: event.query })
	}

	const POST = endpoint(
		(event) =>
			new Generic(<const Body, const Opts extends { query: {} }>(body: Body, options?: Opts) =>
				Generic.endpoint(someEndpoint<Body, Opts['query']>(event))
			)
	)

	let [r1] = POST(new FakeKitEvent())
		.use({ name: 'bob' }, { query: { test: 123 } })
		.$.OK((r) => r.body)

	expect(r1).resolves.toEqual({ body: { name: 'bob' }, query: { test: 123 } })
})

test('Simple endpoint', async () => {
	const GET = endpoint((event) => new OK({ value: '123' }))

	let [r1] = GET(new FakeKitEvent())
		.use()
		.$.OK((r) => r.body)

	expect(r1).resolves.toEqual({ value: '123' })
})

test('endpoint ParseKitEvent', async () => {
	const body = z.object({
		name: z.string().optional()
	})

	const POST = endpoint(
		zod({ body }),
		(event) => {
			return { previousFn: event.body }
		},
		(event) => {
			return new OK(event.results.previousFn)
		}
	)

	let ran = 0

	// @ts-expect-error name must be string
	let r1 = POST(new FakeKitEvent()).use({ name: 123 })
		.any(() => ran++)
		.$.BadRequest((r) => {
			throw new Error('Failed validation', { cause: r })
		})
		.success(() => '')

	let [badRequest] = r1

	expect(badRequest).rejects.toThrow('Failed validation')

	let r2 = POST(new FakeKitEvent())
		.use({ name: 'John' })
		.any(() => ran++)
		.$.BadRequest((r) => {
			throw new Error('Failed validation', { cause: r })
		})
		.success((r) => r.body)[1]

	let success = await r2
	expect(success).toEqual({ name: 'John' })

	expect(ran).toBe(2)
})

test('endpoint: xhr-types', () => {

	const POST = endpoint((event) => new OK({ value: '123' }))

	let xhr = POST(new FakeKitEvent())
		.use.xhr({})
	
})