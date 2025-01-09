<script lang="ts">
	import api from '$api'
	import type { User } from '$routes/(app)/(test)/api/users'
	import type z from 'zod'
	import {
		dataAPI,
		formAPI,
		statefulAPI
	} from 'svelte-data'
	import { floatingUI } from '$lib/floating-ui.svelte'
	import { scale } from 'svelte/transition'

	let Form = formAPI<z.output<typeof User>>(api.users)

	let id = $state() as string | undefined

	let search = statefulAPI(
		(name: string) => (name ? api.users.search(name) : undefined),
		{ warmup: 500 },
	)

	const searchFloat = floatingUI({})

	// let indexed = runesAPI(api, {
	// 	users: {
	// 		discriminator: body => body.id,
	// 		groups: {
	// 			seniors: v => v.filter(v => v.age > 50).sort((a,b) => a.age - b.age)
	// 		}
	// 	},
	// 	articles: {
	// 		discriminator: body => body.id
	// 	}
	// }, {
	// 	indexedDB: { id: 'main' },
	// 	query: o => ({ since: o.lastGetRequestAt })
	// })

	let data = dataAPI({
		users: {
			api: api.users,
			discriminator: (body) => body.id,
			fetch: true,
			groups: {
				seniors: (v) =>
					v.filter((v) => v.age > 50).sort((a, b) => a.age - b.age),
			},
		}
	})

</script>

<!---------------------------------------------------->

<!-- elders: {data.users.groups.seniors.length} -->

<div class="flex gap-2 items-center mb-8 relative">
	{#if search.isLoading && search.args[0]}
		<loading transition:scale class="top-1/2 -translate-y-1/2 -left-6 absolute">
			<icon class="animate-spin iconify fluent--spinner-ios-20-filled"></icon>
		</loading>
	{/if}
	<input
		use:searchFloat.ref
		bind:value={search.args[0]}
		class="!m-0 w-56"
		type="search"
		placeholder="Search users"
	/>
	{#if search.args[0] && search.result}
		<div
			use:searchFloat
			class="bg-gray-950 z-50 rounded flex flex-col gap-2 p-1 w-56 max-h-80 overflow-y-auto"
		>
			{#each search.result as user}
				<button
					class="!bg-transparent hover:!bg-gray-900"
					onclick={() => {
						id = user.id
						search.result = undefined
						search.args[0] = ''
					}}>{user.name}</button
				>
			{/each}
		</div>
	{/if}

	<select
		bind:value={id}
		class="bg-gray-950 border-gray-800 rounded-md m-0 text-primary"
	>
		<option value={undefined}>None</option>
		{#each data.users as user}
			<option value={user.id}>{user.name}</option>
		{/each}
	</select>
</div>

<h3 class="text-xl md-2">
	{id ? 'Updating ' + $Form.name : 'Create new user'}
</h3>

<Form {id}>
	<label>
		Name
		<input name="name" />
		{#each Form.errors('name') as { error }}
			<error>{error}</error>
		{/each}
	</label>
	<label>
		E-mail
		<input name="email" type="email" />
		{#each Form.errors('email') as { error }}
			<error>{error}</error>
		{/each}
	</label>
	<label>
		Birth
		<input name="birth" type="date" />
		{#each Form.errors('birth') as { error }}
			<error>{error}</error>
		{/each}
	</label>
	<label>
		Age
		<input name="age" type="number" />
		{#each Form.errors('age') as { error }}
			<error>{error}</error>
		{/each}
	</label>

	<error hidden={!Form.error?.code}>
		{Form.error?.error}
	</error>

	<button class="mt-4 mr-4" disabled={!!Form.errors.length}
		>{id === undefined ? 'Create User' : 'Update User'}</button
	>
	<button type="reset">Reset</button>
</Form>

<!---------------------------------------------------->
<style lang="postcss">
	input {
		@apply mb-2;
	}

	error {
		@apply block text-red-500;
	}

	button {
		@apply bg-gray-700 hover:bg-gray-600 px-4 py-1 rounded;
	}
</style>
