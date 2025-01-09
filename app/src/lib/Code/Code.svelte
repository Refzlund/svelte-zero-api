<!-- @component

	This is a description, \
	on how to use this.

@example
<Component />

-->

<script lang="ts">
	import { undentString } from '$lib/undent-string'
	import hljs from 'highlight.js'
	import 'highlight.js/styles/atom-one-dark.min.css'

	interface Props {
		code: Record<string, string>
		height?: number
		dynamicHeight?: boolean
	}

	let { 
		code,
		height = $bindable(24),
		dynamicHeight = true
	}: Props = $props()

	let formatted = $derived.by(() => {
		let formatted = {...code}
		for(let key in formatted) {
			const lines = hljs.highlight(undentString(formatted[key]), { language: key.split('.').pop()! }).value.split('\n')
			const html = lines.map((line, index) => {
				return `<span class='line-count'>${index+1}</span><span>${line}</span>`
			}).join('\n')

			formatted[key] = html
		}
		return formatted
	})

	let active = $state(Object.keys(code)[0])

</script>
<!---------------------------------------------------->



<code-container>
	<tabs>
		{#each Object.keys(code) as tab}
			<button
				class:active={tab === active}
				class='text-gray-500'
				onclick={() => active = tab}
			>
				{tab}
			</button>
		{/each}
	</tabs>
	<container style='height: {height}px'>
		{#if dynamicHeight}
			<pre bind:clientHeight={height}><code>{@html formatted[active]}</code></pre>
			{:else}
			<pre><code>{@html formatted[active]}</code></pre>
		{/if}
	</container>
</code-container>



<!---------------------------------------------------->
<style lang='postcss'>

	.active {
		@apply text-primary;
	}

	container {
		@apply block overflow-hidden;
		transition: height 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	
	code-container {
		@apply block;

		:global .line-count {
			@apply inline-flex opacity-20 w-8 items-start justify-end pointer-events-none select-none -translate-x-6;
		}

		code :global {
			font-size: .9rem;
		}

		code {
			@apply grid md:grid-cols-[2rem,1fr] max-sm:grid-cols-[1.25rem,1fr] max-w-full text-wrap;
		}

		pre, button, container {
			@apply block bg-gray-950 rounded-lg border border-gray-800;
		}

		pre {
			@apply p-4 md:px-8 max-sm:px-4 border-0;
		}

		button {
			@apply inline-block md:px-4 max-sm:px-2.5 py-0.5 rounded-b-none border-b-0 cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap duration-100;
			&:not(.active) {
				@apply hover:bg-gray-900;
			}
			&.active {
				@apply max-w-fit w-full;
			}
		}

		tabs {
			@apply flex md:mx-4 max-sm:mx-1.5 z-10 translate-y-[1px] gap-1;
		}
	}

</style>