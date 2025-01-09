import zodToJsonSchema from 'zod-to-json-schema'
import z from 'zod'
import { parseJSON } from 'sveltekit-zero-api/server'
import { BadRequest } from 'sveltekit-zero-api/http'

export function zod<
	Body extends z.ZodTypeAny = never,
	Query extends z.ZodTypeAny = never
>({ body, query }: { body?: Body; query?: Query }) {
	return parseJSON.extend(
		async (_body, _query) => {
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
		},
		body ? zodToJsonSchema(body) : undefined
	)
}
