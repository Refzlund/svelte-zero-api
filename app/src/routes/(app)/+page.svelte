<script>
	import Code from '$lib/Code/Code.svelte'
	import LogoText from '$lib/LogoText.svelte'
	import { onMount } from 'svelte'
	import { Tween } from 'svelte/motion'

	const code = {
		'functions.ts': `
			// SvelteKit-Zero-API - functions
			const result = await api.users.sendMessage(
				'User:1', 'User:2', {...}
			).catch(failedSend)
		`,
		'endpoints.ts': `
			// SvelteKit-Zero-API - endpoints
			const [result] = await api.users.messages.POST({
				userFrom: 'User:1', userTo: 'User:2',
				message: {...}
			})
				.error(failedSend)
				.$.success(r => r.body)
		`,
		'no-zero-api.ts': `
			// without SvelteKit-Zero-API
			const response = await fetch('/api/users/message', {
				method: 'POST',
				body: JSON.stringify({
					userFrom: 'User:1',
					userTo: 'User:2',
					message: {...}
				})
			}).catch(failedSend)
			if(!response.status !== 200) {
				failedSend(response)
				return
			}
			const result = await response.json() as MessageResult
		`
	}

	let tween = new Tween(0, { duration: 30000 })
	onMount(() => {
		tween.target = 100
	})

</script>

<article>
	<h1 class='!mb-0'>Less code, more types</h1>
	<button 
		id=next
		style='--tw-gradient-from-position: {tween.current}%; --tw-gradient-to-position: {tween.current}%;'
	>
		<span>Next up</span><span>Endpoint middlewares</span>
	</button>
	<p>
		<LogoText/> aims to provide a seamless experience,
		developing between frontend and backend.
	</p>
	<p>
		I think it's well established, the code can speak for itself<img class='inline !m-0' src='/star_struck.gif' alt='star-struck' width="30" />
	</p>

	<Code {code} />

</article>


<style lang='postcss'>

	article {
		@apply prose prose-invert prose-blue prose-h1:font-medium;
	}

	#next {
		@apply 
			text-transparent bg-clip-text flex gap-2 
			opacity-60 bg-gradient-to-r from-primary to-white
			hover:opacity-80 duration-100	
		;
	}

</style>