<!-- @component

	SvelteKit zero API logo

@example
<Logo class='scale-125 origin-left' />

-->

<script lang="ts">

	interface Props {
		class?: string
	}
	
	let {
		class: classes
	}: Props = $props()

</script>
<!---------------------------------------------------->



<a class={classes} href='https://github.com/Refzlund/sveltekit-zero-api' target='_blank'>
	<span class="iconify-color devicon--svelte size-5"></span>
	SvelteKit Zero API
</a>



<!---------------------------------------------------->
<style lang='postcss'>
	
	a {
		@apply relative inline-flex items-center gap-[.5ch] !text-primary cursor-pointer translate-y-1;
		&::before {
			content: '';
			@apply absolute top-0 bottom-0 left-0 right-0 bg-primary bg-opacity-5 opacity-0 rounded-lg border border-primary border-opacity-10;
			transition: 150ms ease-in-out;
		}

		&:hover::before {
			@apply -top-0.5 -bottom-0.5 -left-2 -right-2 opacity-100;
		}
	}

</style>
