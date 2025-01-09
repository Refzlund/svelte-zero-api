import { NotFound, OK } from 'sveltekit-zero-api/http'
import { endpoint } from 'sveltekit-zero-api/server'

import fs from 'node:fs'
import path from 'path'

export const GET = endpoint(
	(event) => {
		let p = path.resolve(`./src/routes/(app)/(test)/api/image/[id]/${event.params.id}`)
		if(!fs.existsSync(p)) {
			return new NotFound({ code: 'image_not_found', error: 'Could not find image', details: p })
		}
		let file = fs.createReadStream(p)
		return new OK(file, { headers: { 'Content-Type': 'image/webp' } })
	}
)