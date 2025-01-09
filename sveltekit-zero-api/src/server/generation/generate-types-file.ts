import { complexSlug, optionalSlug, restSlug, simpleSlug } from '../../utils/slugs'
import { serializeFiles } from './serialize-files'

export function generateTypes(
	files: string[],
	importType: string,
	relativeTypePath: string,
	routesLength: number
) {
	let serializedFiles = serializeFiles(files, routesLength)

	interface TypePath {
		type: string | null
		children: { [key: string]: TypePath }
		indent: number
		toString(): string
	}

	function serverPath(key: string | null, indent = 0) {
		return {
			type: null as string | null,
			children: {},
			indent,
			toString() {
				let children = Object.values(this.children).map((v) => v.toString())
				let tabs = '\t'.repeat(indent)
				let str = ''

				if (key) {
					let m: RegExpMatchArray | null
					if ((m = key.match(optionalSlug))) {
						str += `"$${m[1]}$": (${m[1]}?: string | null | undefined) => `
					} else if ((m = key.match(restSlug))) {
						str += `"${m[1]}$$": (...${m[1]}: string[]) => `
					} else if ((m = key.match(simpleSlug))) {
						str += `"${m[1]}$": (${m[1]}: string) => `
					} else if ((m = key.match(complexSlug))) {
						let k = key
						let complex: string[] = []
						do {
							complex.push(m[1])
							k = k.replace(complexSlug, '')
						} while ((m = k.match(complexSlug)))
						str += `"${key}$": (${complex.map((v) => v + ': string').join(', ')}) => `
					} else {
						str += `"${key}": `
					}
				}
				if (children.length) str += `{\n\t${tabs}${children.join(`,\n\t${tabs}`)}\n${tabs}}`
				if (this.type && children.length) str += ' & '
				if (this.type) str += this.type
				return str
			}
		} as TypePath
	}

	let root = serverPath(null)

	for (let [file, serialized] of serializedFiles) {
		let current = root
		for (let key of serialized) {
			if (!current.children[key]) {
				current = current.children[key] = serverPath(key, current.indent + 1)
			} else {
				current = current.children[key]
			}
		}
		current.type = `S<typeof import('${relativeTypePath}${file}')>`
	}

	return `${importType}

export type APIRoutes = ${root.toString()}
	`
}
