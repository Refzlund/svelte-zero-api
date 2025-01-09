<!-- @component

	This is a description, \
	on how to use this.

@example
<Component />

-->

<script lang="ts">

	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
		pink?: boolean
	}

	let { children, pink }: Props = $props()
	

</script>
<!---------------------------------------------------->


<pill
	class:pink
>
	{@render children?.()}
</pill>


<!---------------------------------------------------->
<style lang='postcss'>
	
	pill {
		@apply
			inline-flex items-center justify-center text-sm gap-1 px-2.5 py-0.5 rounded-full
			border border-gray-800 bg-gray-950 bg-opacity-30 text-gray-400
		;

		&.pink {
			@apply border-pink-900 bg-pink-900 bg-opacity-30 text-pink-500;
		}
	}

</style>