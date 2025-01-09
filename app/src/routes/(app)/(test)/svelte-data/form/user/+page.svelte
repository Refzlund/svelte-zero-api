<script lang="ts">
	import Code from '$lib/Code/Code.svelte'
	import { formAPI } from 'svelte-data'
	import api from '$lib/../api'
	import { Spring } from 'svelte/motion'

	interface Person {
		name: string
		age: number
		/** Significant other */
		so?: Person
		children?: Person[]
		pets: string[]
	}

	api.formdata
	
	const UserForm = formAPI<Person & {bind: string}>(api.formdata)
	let progress = new Spring(0)
	$effect(() => {
		progress.target = UserForm.request.progress
	})
</script>

<!---------------------------------------------------->

<bar
	style='--tw-gradient-from-position: {progress.current*100}%; --tw-gradient-to-position: {progress.current*100}%;'
	class='w-60 bg-green-400 h-4 bg-gradient-to-r to-white from-green-600 duration-150 rounded outline-gray-400 my-2'
></bar>

<!-- <form use:UserForm.action class="mb-4"> -->
<UserForm class="mb-4">
	<button type="submit">Submit</button>

	<!-- <input name='name' /> -->
	<input name="name" placeholder="Name" />

	<div contenteditable bind:innerText={$UserForm.bind} class='p-2 px-3 border border-gray-700 rounded-lg'>This is bound</div>

	<input name='value' placeholder='With value' value='Predefined value'>

	<input type='file' name='file' multiple>

	<!-- <input name='so.name' /> -->
	<input name='so.name' placeholder="SO Name" />
	<input name='so.so.so.so.name' placeholder="Deeply nested" />

	<div>
		<button type="button" onclick={() => ($UserForm.children ??= [{} as Person]).push({} as Person)}>
			Add child
		</button>
		{#each $UserForm.children ?? [] as _, i}
			<input name="children.{i}.name" />
		{/each}
	</div>
	<input name="pets[0]" placeholder="Pets[0]" />
</UserForm>

<Code
	code={{
		'result.json': JSON.stringify($UserForm, null, '    ')
	}}
/>

<div></div>

<!---------------------------------------------------->
<style lang="postcss">
</style>
