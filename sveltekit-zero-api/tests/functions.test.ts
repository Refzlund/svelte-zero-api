import { test, expect } from 'bun:test'
import { Created } from './../src/server/http'
import type { Simplify } from '../src/utils/types'
import { functions } from '../src/server/functions'
import { Generic } from '../src/server/generic'
import { BadRequest, OK } from '../src/server/http'
import { FakeKitEvent, type KitEvent } from '../src/server/kitevent'
import { isResponse } from '../src/is-response'

/** Returns a ReadableStream that results in { data: number } over ~110ms */
function streamTest() {
	let i = 10
	const stream = new ReadableStream<{ data: number }>({
		async pull(controller) {
			if (i == 0) return controller.close()
			await new Promise((resolve) => {
				setTimeout(() => resolve(controller.enqueue({ data: i-- })), 10)
			})
		}
	})
	return stream
}

test('functions: receive readable stream', async () => {

	function fn() {
		return new OK(streamTest())
	}

	const PATCH = functions({
		fn
	})

	let fns = PATCH(new FakeKitEvent()).use()

	let i = ''
	for await (const chunk of await fns.fn()) {
		i += `${chunk.data}`
	}

	expect(i).toBe('10987654321')
})

/*
test('functions: send readable stream', async () => {
	
	async function fn(event: KitEvent, stream: ReadableStream<{ data: number }>) {
		let now = Date.now()
		let i = ''
		for await (const chunk of await stream) {
			i += `${chunk.data}`
		}

		return new OK({ data: i, time: Date.now() - now })
	}

	const PATCH = functions({
		fn
	})

	let result = await PATCH(new FakeKitEvent()).use().fn(streamTest())
	expect(result.data).toBe('10987654321')
	expect(result.time).toBeGreaterThanOrEqual(110)
})
*/

test('functions: middleware', async () => {
	
	function fn() {
		return new OK(true)
	}
	function anotherFn() {
		console.log('here')
		return new Created()
	}

	let i = 0
	const PATCH = functions(
		(event) => {
			if(i == 0) {
				i++
				return new BadRequest('error')
			}
			
			return {
				value: 123 as const
			}
		},
		(event) => {
			return {
				thing: 'text'
			}
		},
		event => {
			return new Created(event.results.value)
		},
		{
			fn,
			anotherFn
		}
	)

	const result = await PATCH().use().fn().catch(err => err)
	

	if(isResponse(result)) {
		expect(result.body).toBe('error')
	} else {
		throw new Error('Expected response', { cause: !result ? String(result) : result })
	}

	const result2 = await PATCH().use().anotherFn()
	expect(result2).toBe(123)
})

test('functions', async () => {
	interface Input {
		name: string
		age: number
	}

	function someFn<T extends Simplify<Input>>(event: KitEvent, input: T) {
		if (input.age > 61) {
			return new OK(null)
		}

		if (input.age < 24) {
			return new BadRequest(null)
		}

		return new OK({
			providedData: input
		})
	}

	const PATCH = functions({
		someFn,
		specificFn: (event) => new Generic(<const T extends Input>(input: T) => Generic.fn(someFn(event, input)))
	})

	let fns = PATCH(new FakeKitEvent()).use()

	let result = fns.someFn({ name: 'Shiba', age: 23 })
	expect(result).rejects.toThrow() // Throws a response when not success

	let result2 = fns.specificFn({ name: 'Bob', age: 69.69 })
	expect(result2).resolves.toBe(null)

	let result3 = fns.specificFn({ name: 'Giraffe', age: 26 })
	expect(result3).resolves.toEqual({ providedData: { name: 'Giraffe', age: 26 } })
})
