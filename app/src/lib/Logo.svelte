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



<h1 class={classes}>
	<span class="iconify-color devicon--svelte size-8"></span>
	<sveltekit>
		<span>SVELTE</span>
		<span class='text-secondary grayscale-[.4]'>KIT</span>
	</sveltekit>
	<!-- 1.25px perfectly lines up🎉 -->
	<zero-api>
		<span>Zero</span>
		<span class='text-primary'>API</span>
	</zero-api>
</h1>



<!---------------------------------------------------->
<style lang='postcss'>
	
	h1 {
		@apply grid grid-cols-[min-content,1fr] gap-x-1.5 text-gray-200 w-fit cursor-default;
	}

	sveltekit {
		@apply flex items-center gap-1 text-xl tracking-wide;
	}

	zero-api {
		@apply flex gap-2 col-span-2 text-4xl tracking-wider translate-x-[1.25px] scale-y-90 origin-bottom-left;
	}	

</style>