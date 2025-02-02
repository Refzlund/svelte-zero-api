import type { Plugin } from 'vite'
import fs from 'fs'
import { resolve } from 'path'
import apiTemplate from './api-types/api-template.js'
import { apiUpdater } from './api-types/api-updater.js'

const cwd = process.cwd()

export interface ZeroAPIPluginConfig {
	/**
	 * Where should the api-file be located? 
	 * @default src
	*/
	outputDir?: string

	/** 
	 * The name of the api file?
	 * @default api
	*/
	apiName?: string

	/**
	 * Alternative output for the generated api types
	 * 
	 * By default, it will be relative to the api outputDir inside `.svelte-kit/generated`
	 * 
	 * @example tempOutput: './src/__generated.d.ts'
	*/
	tempOutput?: string

	/**
	 * Where to look for +server.ts files
	 * @default routesDir: './src/routes'
	*/
	routesDir?: string
}

export default function zeroApi(config: ZeroAPIPluginConfig = {}): Plugin {
	if (process.env.NODE_ENV === 'production')
		return { name: 'svelte-plugin-zero-api' }
	
	const {
		outputDir = 'src',
		apiName = 'api',
		routesDir = './src/routes'
	} = config

	// Create src/api.ts if doesn't exist
	const outputPath = resolve(cwd, outputDir, apiName + '.ts')
	if (!fs.existsSync(outputPath)) {
		fs.writeFile(outputPath, apiTemplate, (err) => {
			if (err) {
				console.error(err)
			}
		})
	}

	const resolvedRoutes = resolve(cwd, routesDir)
	
	apiUpdater(config, resolvedRoutes)
	return {
		name: 'svelte-plugin-zero-api',
		configureServer(vite) {
			vite.watcher.on('change', (path) => {
				apiUpdater(config, resolvedRoutes)
			})
		}
	}

}