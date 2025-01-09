import { faker } from '@faker-js/faker'
import z from 'zod'

export const User = z.object({
	id: z.custom<`User:${string}`>(v => typeof v === 'string' && v.startsWith('User:')),
	name: z.string().min(3),
	email: z.string().email(),
	age: z.number().min(18),
	birth: z.date()
})

export const users: z.output<typeof User>[] = Array(100).fill(null).map((_, i) => {
	let birth = faker.date.birthdate()
	return {
		id: `User:${i}`,
		name: faker.person.fullName(),
		email: faker.internet.email(),
		birth: birth,
		age: new Date().getFullYear() - birth.getFullYear(),
	}
})