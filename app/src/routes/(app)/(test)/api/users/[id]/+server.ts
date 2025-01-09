import { randomUUID } from 'node:crypto';
import { Created, NotFound, OK } from 'sveltekit-zero-api/http'
import { endpoint, parseJSON } from 'sveltekit-zero-api/server'
import { User, users } from '..'
import { zod } from '$lib/zod'



export const GET = endpoint(
	async (event) => {
		let user = users.find(user => user.id === event.params.id)
		if(!user) {
			return new NotFound({ 
				code: 'no_user',
				error: 'User not found.'
			})
		}
		
		return new OK(user)
	}
)

export const PUT = endpoint(
	zod({ body: User }),
	(event) => {
		let index = users.findIndex(user => user.id === event.params.id)
		if(index < 0) {
			return new NotFound({ 
				code: 'no_user',
				error: 'User not found.'
			})
		}

		let { name, email, age, birth } = event.body
		
		users[index] = { 
			id: event.params.id!,
			name, email, age, birth
		}
		
		return new OK({ message: 'User updated.' })
	}
)

export const PATCH = endpoint(
	zod({ body: User.partial() }),
	(event) => {
		let user = users.find(user => user.id === event.params.id)
		if(!user) {
			return new NotFound({ 
				code: 'no_user',
				error: 'User not found.'
			})
		}

		let { name, email, age, birth } = event.body

		if(name) user.name = name
		if(email) user.email = email
		if(age) user.age = age
		if(birth) user.birth = birth
		
		return new OK({ message: 'User patched.' })
	}
)