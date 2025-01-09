import { fromUrl } from 'sveltekit-zero-api/client'
import type { OK } from 'sveltekit-zero-api/http'
import type { Endpoint } from 'sveltekit-zero-api/server'

const npm = 'https://api.npmjs.org/downloads/point/last-month/sveltekit-zero-api'
const repo = 'https://api.github.com/repos/Refzlund/sveltekit-zero-api' 

type Github = {
	GET: Endpoint<any,
		OK<{
			stargazers_count: number
		}>
	>
}

type NPM = {
	GET: Endpoint<any,
		OK<{
			downloads: number
		}>
	>
}

export const github = () => fromUrl<Github>(repo).GET().$.success(({ body }) => body)[0]
export const npmjs = () => fromUrl<NPM>(npm).GET().$.success(({ body }) => body)[0]