import { faker } from '@faker-js/faker'
import z from 'zod'

export const Article = z.object({
	id: z.string(),
	title: z.string().min(3).trim(),
	content: z.string().trim()
})

export const articles: z.output<typeof Article>[] = Array(100).fill(null).map((_, i) => {
	return {
		id: 'Article:' + i,
		title: faker.lorem.words(3),
		content: faker.lorem.paragraphs(3),
	}
})