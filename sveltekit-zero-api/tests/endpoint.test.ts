import { test, expect } from 'bun:test'
import { endpoint } from '../src/server/endpoint'
import { BadRequest, KitResponse, OK } from '../src/server/http'
import { FakeKitEvent, type KitEvent, ParseKitEvent } from '../src/server/kitevent'
import { parseJSON } from '../src/server/parsers/parse-json'
import z from 'zod'
import { Generic } from '../src/server/generic'
import zodToJsonSchema from 'zod-to-json-schema'

function zod<Body extends z.ZodTypeAny = never, Query extends z.ZodTypeAny = never>({
	body,
	query
}: {
	body?: Body
	query?: Query
}) {
	return parseJSON.extend(async (_body, _query) => {
		const bodyResult = body?.safeParse(_body)
		if (bodyResult !== undefined && !bodyResult.success) {
			return new BadRequest({
				code: 'invalid_body_schema',
				error: 'Invalid body',
				details: bodyResult.error,
			})
		}

		const queryResult = query?.safeParse(_query)
		if (queryResult !== undefined && !queryResult.success) {
			return new BadRequest({
				code: 'invalid_query_schema',
				error: 'Invalid query schema',
				details: queryResult.error,
			})
		}

		return {
			body: bodyResult?.data as z.output<Body>,
			query: queryResult?.data as z.output<Query>,
		}
	}, body ? zodToJsonSchema(body) : undefined)
}

test('Generic endpoint', async () => {
	function someEndpoint<Body, Query extends {}>(event: KitEvent<{ body: Body; query: Query }>) {
		return new OK({ body: event.body, query: event.query })
	}

	const POST = endpoint(
		(event) =>
			new Generic(<const Body, const Opts extends { query: {} } & RequestInit>(body: Body, options?: Opts) =>
				Generic.endpoint(someEndpoint<Body, Opts['query']>(event))
			)
	)

	let [r1] = POST(new FakeKitEvent())
		.use({ name: 'bob' }, { query: { test: 123 } })
		.$.OK((r) => r.body)

	expect(r1).resolves.toEqual({ body: { name: 'bob' }, query: { test: 123 } })

	let test: (v: 'bob') => void = () => {}
	test((await r1)!.body.name) // type test
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

	// not available on server-side
	let xhr = expect(() => POST(new FakeKitEvent()).use.xhr()).toThrow()
	
})