export function match(param: string) {
	return param === 'latest' || param === 'next' || param === 'v0.15.8' || /v2\.\d+\.\d+/.test(param)
}