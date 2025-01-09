import type { Plugin } from 'vite'
import * as fs from 'node:fs'
import process from 'node:process'
import Path from 'node:path'
import { generateTypes } from './generation/generate-types-file'
import { getEndpointFiles } from './generation/get-endpoint-files'
import type { Config as SvelteKitConfig } from '@sveltejs/kit'

interface ZeroAPIOptions {
	/**
	 * The path where the `api.ts` is located.
	 * If `undefined` then the file wont be generated.
	 *
	 * If `customTypePath` is ***also*** `undefined`, no types will be generated.
	 * @default './src/api'
	 */
	apiPath?: string

	/**
	 * By default, it will be located in `.svelte-kit/types/src/...` relative
	 * to the `apiPath` config.
	 *
	 * For instance `.svelte-kit/types/src/api.d.ts`
	 *
	 * @default undefined
	 * @example './src/api.d'
	 */
	customTypePath?: string | undefined

	/**
	 * Inside the generated `api.d.ts` file we import a type for typing endpoints.
	 *
	 * You can replace this line if you have a custom type/location to use instead.
	 *
	 * @default 'import type { ServerType as S } from "sveltekit-zero-api/client"'
	 */
	customTypeImport?: string
}

let timeout: any
function update(
	options: ZeroAPIOptions,
	/** @example '../..' */
	relativeTypePath: string,
	/** @example 'C:/projects/app/src/' */
	routesPath: string,
	/** @example 'routes' */
	routesDirectory: string,
	routesLength: number
) {
	if (timeout !== undefined) globalThis.clearTimeout(timeout)
	timeout = setTimeout(() => {
		let files = getEndpointFiles(routesPath, routesDirectory)

		fs.writeFileSync(
			Path.resolve(options.customTypePath!),
			generateTypes(files, options.customTypeImport!, relativeTypePath, routesLength)
		)
	}, 111) // sveltekit debounces by 100ms
}

export default function viteZeroAPI(options: ZeroAPIOptions = {}): Plugin {
	if (process.env.NODE_ENV === 'production') return { name: 'vite-plugin-sveltekit-zero-api' }

	options.apiPath ??= Path.normalize('./src/api.ts')
	options.customTypePath ??= Path.join('./.svelte-kit/types', options.apiPath!.replace(/\.ts$/, '.d.ts'))
	options.customTypeImport ??= 'import type { ServerType as S } from "sveltekit-zero-api/client"'

	let svelteConfig: Promise<SvelteKitConfig> = import('file:///' + Path.resolve('./svelte.config.js'))
		.catch((v) => import('file:///' + Path.resolve('./svelte.config.mjs')))
		.then((v) => (svelteConfig = v))

	return {
		name: 'vite-plugin-sveltekit-zero-api',
		transform(code, id, options) {
			
			// Note: KitResponse is extends Error, allowing it to be thrown by Vite.
			if (id.endsWith('kit/src/runtime/server/endpoint.js')) {
				const replaced = code.replace(
					'!(response instanceof Response)',
					'!(response instanceof KitResponse || response instanceof Response)'
				)
				code = `import { KitResponse } from 'sveltekit-zero-api/http'\n${replaced}`
			}
			
			return code
		},
		async configureServer(vite) {
			let routes = Path.resolve((await svelteConfig)?.kit?.files?.routes ?? './src/routes').split(Path.sep)

			let routesDirectory = routes.pop()!
			let routesPath = routes.join('/') // for TS imports

			// must be / instead of `Path.sep` for TS
			let relativeTypePath = Array(options.customTypePath!.split(Path.sep).length - 1)
				.fill('..')
				.join('/')
			// when serializing, cut this part off for the routed types
			let routesLength = Path.join((await svelteConfig)?.kit?.files?.routes ?? './src/routes').split(
				Path.sep
			).length

			update(options, relativeTypePath, routesPath, routesDirectory, routesLength)
			vite.watcher.on('change', () =>
				update(options, relativeTypePath, routesPath, routesDirectory, routesLength)
			)
		}
	}
}
