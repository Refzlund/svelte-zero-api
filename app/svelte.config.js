import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// * Hide Unused CSS as we use tailwind `@apply ` statement.
		warningFilter: (warn) => ![
			'css_unused_selector'
		].some(m => warn.code.includes(m)),
		runes: true
	},
	kit: {
		adapter: adapter(),
		alias: {
			'$api': './src/api.ts',
			'$routes': './src/routes'
		},
		
	},
	
}

export default config
