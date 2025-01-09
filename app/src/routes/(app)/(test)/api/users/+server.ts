import { Created, OK } from 'sveltekit-zero-api/http'
import { endpoint, functions, type KitEvent } from 'sveltekit-zero-api/server'
import { User, users } from '.'
import { zod } from '$lib/zod'


export const GET = endpoint(
	() => new OK(users)
)

export const POST = endpoint(
	zod({ body: User.omit({ id: true }) }),
	(event) => {
		let { name, email, age, birth } = event.body
		
		users.push({ id: `User:${users.length}`, name, email, age, birth })
		
		return new Created(users[users.length - 1])
	}
)

export const PATCH = functions({
	search: (event: KitEvent, name: string) => {	
		return new OK(
			users.filter(user => user.name.includes(name))
		)
	}
})