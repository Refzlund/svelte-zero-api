<script lang="ts">
	import api from '$api'
	import { dataAPI } from 'svelte-data'

	let data = dataAPI({
		paged: {
			api: api.articles,
			discriminator: (body) => body.id,
			paginator: {
				page: (index) => api.articles.paginate(index),
				total: () => api.articles.totalPages(),
				cooldown: 444
			},
		},
		listed: {
			api: api.articles,
			discriminator: (body) => body.id,
			paginator: {
				skip: 'skip',
				limit: 'limit',
				count: 12,
				total: () => api.articles.totalArticles(),
				range: (query) =>
					api.articles.range({ limit: query.limit, skip: query.skip }),
			},
		},
	})

	const paged = new data.paged.Paginator({ startPosition: 3, await: false })
	const listed = new data.listed.Paginator({ startPosition: 12*3 })
</script>

<!---------------------------------------------------->

<div class='flex gap-8'>
	<div>
		<ul>
			<div>page {(paged.current)+1} of {paged.total+1}</div>
			<div><button onclick={() => paged.next()}>Next</button></div>
			<div><button onclick={() => paged.prev()}>Previous</button></div>

			{#each paged.list as article}
				<li>{article.title}</li>
			{/each}
		</ul>

		<ul>
			<div>Items {listed.current+1}-{listed.current+listed.count} of {listed.total+1}</div>
			<div><button onclick={() => listed.next()}>Next</button></div>
			<div><button onclick={() => listed.prev()}>Previous</button></div>

			{#each listed.list as article}
				<li>{article.title}</li>
			{/each}
		</ul>
	</div>

	<ul class='max-h-[50rem] overflow-auto'>
		{#each paged.listed as article}
			<li>{article.title}</li>
		{/each}
	</ul>
</div>

<!---------------------------------------------------->
<style lang="postcss">
	button {
		@apply px-2 py-1 rounded bg-primary;
	}
</style>
