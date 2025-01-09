import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import zeroAPI from '../sveltekit-zero-api/npm/dist/server/vite'

export default defineConfig({
	plugins: [
		sveltekit(),
		zeroAPI()
	],
	server: {
		fs: {
			allow: ['..']
		}
	}
})
