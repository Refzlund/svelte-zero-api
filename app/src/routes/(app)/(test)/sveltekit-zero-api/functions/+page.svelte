<script lang='ts'>

	import api from '$api'
	import { onMount } from 'svelte'
	import { getUrl } from 'sveltekit-zero-api/client'

	// api.fns.someFunction().catch(res => console.log('caught', res.body))

	let message = $state('')
	let message2 = $state('')
	let message3 = $state('')

	onMount(async () => {
		for await (let result of await api.fns.streamingData()) {
			message += result.data + ' '
		}
	})

	api.fns.PUT().OK(async res => {
		for await (let result of res.body) {
			message2 += result.data + ' '
		}
	})

	api.fns.SSE()
		.on.event1(e => message3 += e.data + ' ')
		.on.event2(e => message3 += `<u>${e.data2}</u> `)

</script>
<!---------------------------------------------------->

<div class='flex items-center gap-4'>
	<img class='rounded hover:scale-110 duration-100' src={getUrl(api.image.id$('cute.webp'))} alt='Shiba + Giraffe' width='200px'>

	<div>
		<div>
			{message}
		</div>
		<div>
			{message2}
		</div>
		<div>
			{@html message3}
		</div>
	</div>
</div>

<!---------------------------------------------------->
<style lang='postcss'>
	
	

</style>