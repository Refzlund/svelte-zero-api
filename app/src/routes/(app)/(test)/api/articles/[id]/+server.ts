import { NotFound, OK } from 'sveltekit-zero-api/http'
import { endpoint } from 'sveltekit-zero-api/server'
import { Article, articles } from '..'
import { zod } from '$lib/zod'



export const GET = endpoint(
	async (event) => {
		let article = articles.find(article => article.id === event.params.id)
		if(!article) {
			return new NotFound({ 
				code: 'no_article',
				error: 'Article not found.'
			})
		}
		
		return new OK(article)
	}
)

export const PUT = endpoint(
	zod({ body: Article }),
	(event) => {
		let index = articles.findIndex(article => article.id === event.params.id)
		if(index < 0) {
			return new NotFound({
				code: 'no_article',
				error: 'Article not found.',
			})
		}

		let { title, content } = event.body
		
		articles[index] = { 
			id: event.params.id! as `Article:`,
			title, content
		}
		
		return new OK({ message: 'Article updated.' })
	}
)

export const PATCH = endpoint(
	zod({ body: Article.partial() }),
	(event) => {
		let article = articles.find(article => article.id === event.params.id)
		if(!article) {
			return new NotFound({ 
				code: 'no_article',
				error: 'Article not found.'
			})
		}

		let { title, content } = event.body

		if(title) article.title = title
		if(content) article.content = content
		
		return new OK({ message: 'Article patched.' })
	}
)

export const DELETE = endpoint(
	(event) => {
		let index = articles.findIndex(article => article.id === event.params.id)
		if(index < 0) {
			return new NotFound({
				code: 'no_article',
				error: 'Article not found.',
			})
		}

		articles.splice(index, 1)
		
		return new OK({ message: 'Article deleted.' })
	}
)
