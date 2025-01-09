<script module lang='ts'>
	
	export interface OptionProps {
		children?: Snippet<[boolean]>
		value: any
	}

</script>

<script lang="ts">

	import { onMount, type Snippet } from 'svelte'
	import { selectContext } from './Select.svelte'

	let props: OptionProps = $props()
	const select = selectContext.get()
	
	if(!select)
		throw new Error('<Select.Option> Must be a child of <Select>')

	onMount(() => {
		select.options.push(props)
		return () => select.options.splice(select.options.indexOf(props), 1)
	})

</script>


{#if select.selected?.value !== props.value}
	<button
		onclick={() => select.selectValue(props.value)}
	>
		{#if props.children}
			{@render props.children(false)}
		{:else}
			{props.value}
		{/if}
	</button>
{/if}


<style lang='postcss'>
	
	button {
		@apply flex items-center px-2 py-1.5 cursor-pointer rounded;

		&:hover {
			@apply bg-gray-600 bg-opacity-30;
		}
	}

</style>