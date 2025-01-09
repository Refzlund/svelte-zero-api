<!-- @component

	Header for the site

@example
<Header />

-->

<script lang="ts">
	import Logo from '$lib/Logo.svelte'
	import Pill from '$lib/Pill.svelte'
	import Select from '$lib/Select'

	interface Props {
		height: number
	}

	let { height }: Props = $props()

	let documentationVersion = $state('2.0.0')
</script>
<!---------------------------------------------------->


<header style="height: {height}px">
	<Logo />

	<div>Seamless TypeSafety === Better DX</div>

	<Select bind:value={documentationVersion}>
		<Select.Option value="2.0.0">
			{#snippet children(selected)}
				<span class:selected>
					Docs v2.0.0
					<Pill pink>Next</Pill>
				</span>
			{/snippet}
		</Select.Option>
	</Select>

	<circle id=a></circle>
	<circle id=b></circle>
</header>


<!---------------------------------------------------->
<style lang="postcss">
	header {
		@apply fixed top-0 left-0 right-0 grid bg-gray-950 items-center z-[9999]
			grid-cols-[14rem,1fr,14rem] px-24 overflow-hidden bg-opacity-80 backdrop-blur-lg;

		&::after {
			content: '';
			background: radial-gradient(
				50% 50% at 50% 50%,
				theme('colors.gray.500') 0%,
				rgba(255, 255, 255, 0) 110%
			);
			@apply absolute bottom-0 left-0 right-0 h-[2px] opacity-60;
		}
	}

	div {
		@apply font-light italic text-gray-500 text-center sm:md:opacity-0 lg:opacity-100;
		font-size: clamp(theme('fontSize.base'), 1.75vw, theme('fontSize.xl'));
	}

	span {
		@apply flex w-full justify-between items-center;
		&.selected {
			@apply text-primary text-opacity-85 hover:text-opacity-100 group-hover:text-opacity-100;
		}
	}

	circle {
		@apply absolute rounded-full w-[22rem] h-24 blur-[10rem];

		&#a {
			@apply bg-primary w-[42rem] -bottom-[13rem] left-[200px];
		}
		&#b {
			@apply bg-secondary -bottom-[8rem] right-[250px];
		}
	}
</style>
