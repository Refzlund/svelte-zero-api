<!-- @component

	This is a description, \
	on how to use this.

@example
<Component />

-->

<script lang="ts">

	/*
		homepage: Snippet
		sections: {
			name: string
			pages: {
				href: string
				title: string
				page: Snippet
			}[]
		}[]
	*/

	import type { Snippet } from 'svelte'
	import Header from './Header.svelte'
	import Sidebar from './Sidebar.svelte'
	import type { LayoutData } from './$types'

	interface Props {
		children?: Snippet
		data: LayoutData
	}

	let { children, data }: Props = $props()

	let clientWidth = $state(data.mobile ? 425 : 800)
	let mobile = $derived(clientWidth < 800)
	
	let fromTop = $state(0)
	let page: HTMLElement = $state(undefined as any)

	function onScroll() {
		fromTop = page.scrollTop
	}

	let header = $derived(
		Math.max(100,
			Math.min(
				200,
				200 / Math.max(1, 1 + fromTop * 0.005)
			)
		)
	)

</script>
<!---------------------------------------------------->

<svelte:body bind:clientWidth />

<app class:mobile>
	{#if !mobile}
		<Header height={header} />
	{/if}
	<Sidebar marginTop={header} {mobile} />
	<page bind:this={page} onscroll={onScroll}>
		{#if !mobile}
			<desktop>
				{@render children?.()}
			</desktop>
		{:else}
			<mobile>
				{@render children?.()}
			</mobile>
		{/if}
	</page>
</app>


<!---------------------------------------------------->
<style lang='postcss'>
	
	app {
		@apply
			grid grid-cols-[calc(15rem+6rem),1fr] grid-rows-1
			h-screen w-screen text-gray-300 bg-gray-900 overflow-hidden
		;

		page {
			@apply flex justify-center h-full w-full overflow-auto py-4 px-6 pt-[200px];
		}

		desktop {
			@apply max-w-2xl w-full py-14;
		}

		desktop, mobile {
			@apply flex flex-col h-max pb-[75vh];
		}

		&.mobile {
			@apply grid-rows-1 grid-cols-1;

			page {
				@apply block ml-5 p-7;
			}
		}

		&:not(.mobile) :global {
			/* scrollbar-color: theme('colors.gray.800') theme('colors.gray.950');
			scrollbar-width: thin; */

			/* width */
			::-webkit-scrollbar {
				@apply w-2;
			}

			/* Track */
			::-webkit-scrollbar-track {
				@apply bg-transparent;
			}

			/* Handle */
			::-webkit-scrollbar-thumb {
				@apply bg-gray-800 rounded-full cursor-grab;
			}

			/* Handle on hover */
			::-webkit-scrollbar-thumb:hover {
				@apply bg-gray-700;
			}
		}

		:global(label > input) {
			@apply mt-1;
		}

		:global(label:has(> input)) {
			@apply relative;
		}

		:global(label:has(> input[required])::after) {
			content: '*';
			right: 0;
			top: 0;
			position: absolute;
			transform: scale(.9) translateX(-.4rem);
		}

		:global(input), :global(select) {
			 
			@apply block bg-gray-950 rounded-lg border border-gray-800 ring-transparent;

			&:focus {
				@apply border-primary border-opacity-50;
			}

			&::placeholder {
				&::before {
					content: 'text';
					@apply block  text-gray-400 text-sm select-none pointer-events-none;
				}
			}

			&::after {
				
			}
			
		}
	}

	

	

</style>