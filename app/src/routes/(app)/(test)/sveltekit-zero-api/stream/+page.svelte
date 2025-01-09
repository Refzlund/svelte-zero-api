<script lang="ts">

	import api from '$api'
	

	interface TrackedReadableStream {
		/** between 0 and 1 */
		progress: number
		status: 'pending' | 'started' | 'cacelled' | 'done'
		/** Whether it was cancelled */
		cancelled?: unknown
		uploaded: number
		totalSize: number
	}

	function trackedReableStream(readableStream: ReadableStream, totalSize: number) {
		let state = $state({
			progress: 0,
			status: 'pending',
			uploaded: 0,
			totalSize
		}) as TrackedReadableStream

		let reader = readableStream.getReader()

		const stream = new ReadableStream({
			start(controller) {
				state.status = 'started'
			},
			async pull(controller) {
				const { done, value } = await reader.read()
				if (done) {
					state.status = 'done'
					return controller.close()
				}
				state.uploaded += value.length
				state.progress = state.uploaded / state.totalSize
				controller.enqueue(value)
			},
			cancel(reason) {
				state.cancelled = reason
				state.status = 'cacelled'
				reader.cancel(reason)
			}
		})

		return { stream, state }
	}

	let uploadState = $state({}) as TrackedReadableStream

	function upload() {
		const data = new FormData()
		data.append('some-file', input.files![0])

		api.videos.POST.xhr(data)
			.uploadProgress(e => console.log('progress', e))
			.uploadLoadend(e => console.log('loadend', e))
			.any(res => console.log(res))
	}

	let input = $state() as HTMLInputElement
	

</script>
<!---------------------------------------------------->

<input bind:this={input} type='file'>

<button onclick={upload}>Start upload</button>
{JSON.stringify(uploadState)}


<!---------------------------------------------------->
<style lang='postcss'>
	
	

</style>