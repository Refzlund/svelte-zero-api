export function stream<T>(fn: () => Generator<T> | AsyncGenerator<T>) {
	const stream = new ReadableStream<T>({
		async pull(controller) {
			await new Promise((resolve) => setTimeout(resolve, 0))
			for await (const chunk of fn()) {
				let data = typeof chunk === 'string' ? chunk : JSON.stringify(chunk)
				controller.enqueue(data as any)
			}
			controller.close()
		}
	}) as ReadableStream<T> & {
		[Symbol.asyncIterator](): AsyncIterable<T>
	}

	Object.assign(stream, {
		async *[Symbol.asyncIterator]() {
			const reader = stream!.getReader()
			let decode = new TextDecoder()
			while (true) {
				const { value, done } = await reader.read()
				if (done) return
				else {
					let text = decode.decode(value as any)
					try {
						yield JSON.parse(text)
					} catch (error) {
						yield text
					}
				}
			}
		},
	})

	return stream
}
