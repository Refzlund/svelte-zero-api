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
	
	const UserForm = formAPI<Person & {bind: string}>(api.formdata)
	// console.log($UserForm)
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

<UserForm class="mb-4">
	<button type="submit">Submit</button>
	<input name='name'>
	<div contenteditable bind:innerText={$UserForm.bind} class='p-2 px-3 border border-gray-700 rounded-lg'>This is bound</div>
</UserForm>

<Code
	code={{
		'result.json': JSON.stringify($UserForm, null, 4)
	}}
/>

<div></div>

<!---------------------------------------------------->
<style lang="postcss">
</style>
