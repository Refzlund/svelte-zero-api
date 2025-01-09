export function objectDifference(
	/** Compare to this value */
	match: Record<PropertyKey, any> | Array<any>, 
	/** Use this value */
	use: Record<PropertyKey, any> | Array<any>, 
	toJSON = true
) {
	if('toJSON' in match) {
		match = match.toJSON()
	}
	if('toJSON' in use) {
		use = use.toJSON()
	}

	if(typeof use !== 'object') {
		if(match !== use)
			return use
		return undefined
	}
	
	let item = Array.isArray(use) ? [] : {}
	for (const [key, value] of Object.entries(use)) {
		if (value && typeof value === 'object') {
			let result = objectDifference(value, match[key])
			if(result)
				item[key] = result
			continue
		}
		if (value !== match[key]) {
			item[key] = value
		}
	}
	if (Object.entries(item).length === 0)
		return undefined
	return item
}