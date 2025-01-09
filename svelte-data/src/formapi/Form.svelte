<!-- @component

	This is a description, \
	on how to use this.

@example
<Form enhance={false} id='User:1'>
	<input name='name'>
</Form>

-->

<script lang='ts'>

	import { setContext, type Snippet } from 'svelte'
	import type { FormAPIActionOptions } from './formapi.svelte'
	import type { HTMLFormAttributes } from 'svelte/elements'

	interface Props {
		children: Snippet
	}

	let {
		children,
		id,
		value,
		// @ts-expect-error internal property
		__formApi,
		...formAttributes
	}: Props & FormAPIActionOptions<any> & HTMLFormAttributes = $props()

	setContext('formapi', __formApi)
	
</script>
<!---------------------------------------------------->


<form use:__formApi.action={{ id, value }} {...formAttributes}>
	{@render children()}
</form>


<!---------------------------------------------------->