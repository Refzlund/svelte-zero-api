export async function parseResponse(res: Response) {
	let contentType = res.headers.get('content-type')
	if (contentType?.includes('application/json')) {
		let body = await res.json()
		Object.defineProperty(res, 'body', {
			get() {
				return body
			}
		})
	}
	if (res.body instanceof ReadableStream) {
		// polyfill body-'Symbol.asyncIterator'
		Object.assign(res.body, {
			async *[Symbol.asyncIterator]() {
				const reader = res.body!.getReader()
				let decode = new TextDecoder()
				while (true) {
					const { value, done } = await reader.read()
					if (done) return
					if (!contentType?.includes('plain/text')) yield value
					else {
						let text = decode.decode(value)
						try {
							yield JSON.parse(text)
						} catch (error) {
							yield text
						}
					}
				}
			}
		})
	}
	return res
}