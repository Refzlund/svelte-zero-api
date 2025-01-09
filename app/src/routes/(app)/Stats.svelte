<script module lang='ts'>
	import { npmjs, github } from '$lib/fetch'
	import { browser } from '$app/environment'

	let npmjsData: ReturnType<typeof npmjs> | undefined = $state()
	let githubData: ReturnType<typeof github> | undefined = $state()

	if(browser) {
		npmjsData = npmjs()
		githubData = github()
	}

</script>

<div class='flex items-center justify-between'>
	<a
		class='flex items-center group'
		aria-label='SvelteKit-zero-api GitHub'
		href='https://github.com/Refzlund/sveltekit-zero-api'
		target='_blank'
	>
		<icon class='size-6 iconify devicon--github'></icon>
		{#if githubData}
			{#await githubData then data}
				{#if data}
					<span class='pl-2.5 text-sm text-gray-400'>
						{data.stargazers_count} 
						<span class='duration-100 group-hover:text-yellow-500'>★</span>
					</span>
				{/if}
			{/await}
		{/if}
	</a>
	<a
		class='flex items-center group'
		aria-label='SvelteKit-zero-api NPM JS'
		href='https://www.npmjs.com/package/sveltekit-zero-api'
		target='_blank'
	>
		{#if npmjsData}
			{#await npmjsData then data}
				{#if data}
					<span class='pr-2.5 text-sm text-gray-400'>
						<span class='duration-100 group-hover:text-blue-500'>↓</span>
						{data.downloads}/mo
					</span>
				{/if}
			{/await}
		{/if}
		<icon class='size-6 iconify-color devicon--npm group-hover:text-yellow-300'></icon>
	</a>
</div>