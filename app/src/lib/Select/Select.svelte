<!-- @component

	A single select dropdown

@example
<Select bind:value>
	Value will be displayed, if no children
	<Select.Option value='First value' /> 
	<Select.Option value='2nd'>Second value</Select.Option> 
</Select>

-->

<script module lang='ts'>
	
	import { createContext } from '$lib/context.svelte'
	import type { OptionProps } from './Option.svelte'

	interface Context {
		selectValue: (value: any) => void
		options: OptionProps[]
		selected?: OptionProps
		open: boolean
	}

	export const selectContext = createContext<Context>('select-component')

</script>

<script lang="ts" generics="T">

	import { setContext, type Snippet } from 'svelte'
	
	import { flip, floatingUI, offset } from '$lib/floating-ui.svelte'
	import { portal } from '$lib/portal.svelte'
	import { fly } from 'svelte/transition'
	

	interface Props {
		/** Shown when empty value*/
		label?: string
		children: Snippet
		value?: T
	}

	let { 
		children, 
		label, 
		value = $bindable(undefined)
	}: Props = $props()

	const options = $state([] as OptionProps[])

	let float = floatingUI({
		placement: 'bottom',
		middleware: [
			offset(10),
			flip()
		]
	})

	let width = $state(0)

	let context: Context = $state({
		selected: options.find(o => o.value === value),
		selectValue,
		options,
		open: false
	})

	selectContext.set(context)

	$effect.pre(() => {
		context.selected = options.find(o => o.value === value)
	})

	let open = $derived(context.open && (options.length > 1 || !value))

	function selectValue(_value: T) {
		value = _value
		context.open = false
	}

</script>
<!---------------------------------------------------->

<button
	class:open
	class='group'
	onclick={() => context.open = !context.open}
	bind:clientWidth={width}
	use:float.ref
>
	{#if !context.selected}
		<span>{label ?? 'Select'}</span>
	{:else}
		{#if context.selected.children}
			{@render context.selected.children(true)}
		{:else}
			<span>{context.selected.value}</span>
		{/if}
	{/if}
	{#if options.length > 1 || !value}
		<icon class='iconify fluent--chevron-right-20-regular'></icon>
	{/if}
</button>

<!--
	We use a dialog to display the dropdown above
	all other elements.

	We portal it to the body, for potential unsupported browsers.
-->

<dialog
	{open}
	style:width='{width}px'
	use:float
	use:portal
>
	{@render children?.()}
</dialog>

<!---------------------------------------------------->
<style lang='postcss'>

	button {
		@apply 
			flex rounded justify-between px-4 py-2 border border-primary gap-1.5
			border-opacity-50 hover:border-opacity-75 duration-100 items-center
		;
		&.open { @apply border-opacity-100; }
		icon { @apply size-5 motion-safe:duration-150 rotate-0; }
		&.open icon { @apply rotate-90; }
	}

	span {
		@apply flex gap-2;
	}
	
	dialog {
		@apply
			grid grid-flow-row gap-1
			m-0 bg-gray-950 bg-opacity-30 text-gray-200 z-[1000000]
			px-2 py-2 rounded-lg backdrop-blur-sm border border-gray-800
		;

		transition: transform 150ms ease-in-out, opacity 150ms ease-in-out;
		&:not([open]) {
			display: none;
			/* doesnt work🤷 I'll deal with it later */
			/* @apply motion-safe:animate-[fly_150ms_ease-in-out_forwards_reverse]; */
		}
		&[open] {
			@apply motion-safe:animate-[fly_150ms_ease-in-out_forwards];
		}
	}

	@keyframes fly {
		0% {
			opacity: 0;
			transform: translateY(-10px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

</style>