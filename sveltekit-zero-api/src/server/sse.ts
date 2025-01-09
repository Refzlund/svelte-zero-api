import { KitEvent } from './kitevent'


export class SSE<
	TEvent extends KitEvent = KitEvent,
	T extends { event: string; data: any } = any
> {
	fn: (event: TEvent) => Generator<T> | AsyncGenerator<T>
	createStream: (event: TEvent) => ReadableStream

	constructor(fn: (event: TEvent) => Generator<T> | AsyncGenerator<T>) {
		this.fn = fn
		const encoder = new TextEncoder()
		let id = 0
		this.createStream = (event) => {
			let close = () => {}
			const stream = new ReadableStream({
				async start(controller) {
					close = () => controller.close()
					await new Promise((resolve) => setTimeout(resolve, 0))
					for await (const chunk of fn(event)) {
						let data =
							typeof chunk.data === 'string'
								? chunk.data
								: JSON.stringify(chunk.data)
						controller.enqueue(encoder.encode(`id: ${id++}\n`))
						controller.enqueue(encoder.encode(`event: ${chunk.event}\n`))
						controller.enqueue(encoder.encode(`data: ${data}\n\n`))
					}

					controller.enqueue(encoder.encode(`id: ${id++}\n`))
					controller.enqueue(encoder.encode(`event: __END__\n`))
					controller.enqueue(encoder.encode(`data: \n\n`))
					controller.close()
				}
			})

			event.request.signal.addEventListener('abort', () => {
				close()
			})

			return stream
		}
	}

	static event<E extends string, T>(event: E, data: T) {
		return { event, data }
	}
}

