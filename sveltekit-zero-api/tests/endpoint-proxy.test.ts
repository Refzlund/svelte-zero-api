import { test, expect } from 'bun:test'
import { BadRequest, KitResponse, OK } from '../src/server/http'
import { FakeKitEvent } from '../src/server/kitevent'
import { endpoint } from '../src/server/endpoint'
import { KitRequest, ReturnedKitRequest } from '../src/endpoint-proxy'

test('proxy exception catching ᵗʰᵉᵐ ᵃˡˡ', async () => {
	const GET = endpoint(() => new OK())

	let successCalls = 0
	const fn = () =>
		GET(new FakeKitEvent()).use()
			.success(() => successCalls++)
			.$.OK((r) => {
				throw new Error('🦒')
			})
			.OK((r) => '🐕')

	const r1 = fn() // 1
	expect(r1.catch((e) => e.message)).resolves.toBe('🦒')

	const r2 = fn() // 2
	expect(async () => await r2).toThrow()

	const [r3, r4] = fn() // 3
	expect(r3).rejects.toThrow()
	expect(r4).resolves.toBe('🐕')

	expect(successCalls).toBe(3)
})

test('proxy indepedence ᵈᵃʸ', async () => {
	const GET = endpoint(() => (Math.random() > 0.5 ? new OK() : new BadRequest()))
	const f = () => GET(new FakeKitEvent()).use()

	let rootRuns = 0
	const root = f().any(() => rootRuns++)
	const $root = root.$.any((r) => 'root' as const)

	let a = root.$.any((r) => 'any' as const)
	let b = $root.OK((r) => 'ok' as const).BadRequest((r) => 'br' as const)

	let z = root.any(() => rootRuns++)

	let [a1] = a
	let [root1, b1, b2] = b

	expect(root1).resolves.toBe('root')
	expect(a1).resolves.toBe('any')
	expect(await b1).toSatisfy(v => v === 'ok' || v === undefined)
	expect(await b2).toSatisfy(v => v === 'br' || v === undefined)
	expect(await z).toBeInstanceOf(Response)
})

test('proxy instanceof', async () => {
	function functionParamProxy<T extends KitRequest>(e: T) {
		if (e instanceof KitRequest) return e
		throw new Error()
	}
	function functionParamReturnedProxy<T extends ReturnedKitRequest>(e: T) {
		if (e instanceof ReturnedKitRequest) return e
		throw new Error()
	}

	const GET = endpoint(() => new OK())

	const f = GET(new FakeKitEvent()).use()

	let ran = 0

	// Is an Endpoint Proxy
	functionParamProxy(f.OK(() => ran++))

	let r = functionParamReturnedProxy(f.$.OK(() => 'ok'))

	// @ts-expect-error Is not returned
	expect(() => functionParamReturnedProxy(f.success(() => ran++))).toThrow()

	// @ts-expect-error Is not a EndpointProxy
	expect(() => functionParamProxy({})).toThrow()

	expect(r[0]).resolves.toBe('ok')
	expect(r[1]).toBeUndefined()

	expect(await f).toBeInstanceOf(Response)
	expect(ran).toBe(2)
})

test('Promise<Proxy>.use applies value', async () => {
	const POST = endpoint(async (event) => new OK(await event.request.json()))

	const [r1] = POST(new FakeKitEvent())
		.use({ name: 'John' })
		.$.OK((r) => r.body)

	expect(r1).resolves.toEqual({ name: 'John' })
})
