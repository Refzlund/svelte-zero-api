import Bun from 'bun'
import * as fs from 'node:fs'
import Path from 'node:path'

console.log('Building...')

let paths = {
	package: Path.resolve('./package.json'),
	readme: Path.resolve('../README.md'),
	license: Path.resolve('../LICENSE'),
	
	// generated
	npm: Path.resolve('./npm'),
	dist: Path.resolve('./dist'),
	sveltekit: Path.resolve('./.svelte-kit')
}

// Delete files used for building/results of building
for(const path of [paths.npm, paths.dist, paths.sveltekit]) {
	if(fs.existsSync(path))
		fs.rmSync(path, { recursive: true, force: true })
}

const result = Bun.spawnSync({
    cmd: ['svelte-package']
})

if (result.stderr.length > 0) {
    console.error('svelte-package error:', result.stderr.toString())
}

if (!fs.existsSync(paths.dist)) {
    console.error('Error: dist directory was not created.')
    process.exit(1)
}

fs.mkdirSync(paths.npm)

// Copy files
for (const path of [paths.package, paths.readme, paths.license]) {
	fs.copyFileSync(path, Path.join(paths.npm, Path.basename(path)))
}

// Move files
for (const path of [paths.dist]) {
	let target = Path.join(paths.npm, Path.basename(path))
	for (let i = 0; i < 20; i++) {
		// When the file(s) has been recently modified, the file is locked,
		// as its most likely being used by another process still.
		// So we retry moving the file, until its not locked anymore.
		await new Promise((res) => setTimeout(res, 100))
		try {
			fs.renameSync(path, target)
		} catch (error) {
			if(i === 19) {
				console.error('Failed to rename file during build')
				throw error
			}
			continue
		}
		break
	}
}

// Delete unncessary dir
for (const path of [paths.sveltekit]) {
	if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true })
}

// Update package.json
let packagePath = Path.join(paths.npm, Path.basename(paths.package))

let json = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
delete json.devDependencies
delete json.scripts

for(let [key, path] of Object.entries(json.exports) as [string,string][]) {
	path = path.replace(/^\.\/src/, './dist')
	json.exports[key] = {
		types: path.replace(/\.ts$/, '.d.ts'),
	}
	let type = /svelte(\.ts)?$/.test(key) ? 'svelte' : 'default'
	json.exports[key][type] = path.replace(/\.ts$/, '.js')
}

fs.writeFileSync(packagePath, JSON.stringify(json, null, 4))

Bun.spawnSync({
    cmd: ['bun', 'run', 'fix-imports']
})

console.log('Done.')