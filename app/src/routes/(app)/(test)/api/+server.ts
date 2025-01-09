import { endpoint } from 'sveltekit-zero-api/server'
import { users } from './users'
import { articles } from './articles'
import { OK } from 'sveltekit-zero-api/http'

export const GET = endpoint(
	(e) => {
		return new OK({ users, articles })
	}
)
