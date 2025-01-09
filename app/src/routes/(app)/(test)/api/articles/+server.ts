import { Created, OK } from 'sveltekit-zero-api/http'
import { endpoint, functions, type KitEvent } from 'sveltekit-zero-api/server'
import { Article, articles } from '.'
import { zod } from '$lib/zod'


export const GET = endpoint(() => new OK(articles))

export const POST = endpoint(
	zod({ body: Article.omit({ id: true }) }),
	(event) => {
		let { title, content } = event.body

		articles.push({ id: `Article:${articles.length}`, title, content })

		return new Created(articles[articles.length - 1])
	}
)

export const PATCH = functions({
	paginate(_, index: number) {
		return new OK(
			articles.slice(index * 12, index * 12 + 12)
		)
	},
	range(_, { skip, limit }: { skip: string; limit: string }) {
		return new OK(
			articles.slice(+skip, +skip + +limit)
		)
	},
	totalPages() {
		return new OK(Math.ceil(articles.length / 12))
	},
	totalArticles() {
		return new OK(articles.length)
	}
})