import { test } from 'bun:test'
import z from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

test('test', async () => {
	// https://www.npmjs.com/package/zod-to-json-schema
	// https://typeschema.com

	const body = z.object({
		name: z
			.string()
			.min(3)
			.regex(/^[a-zA-Z]+$/),
		age: z.number().min(18),
		foods: z.array(z.string()).min(1),
		avatar: z
			.instanceof(File)
			.refine((v) => v.size < 1_000_000, 'Avatar must be less than 1MB'),
	})

	const schema = zodToJsonSchema(body)
	console.log(schema)
})