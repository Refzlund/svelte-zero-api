import type { ServerType as S } from "../src/client/index.ts"

export type APIRoutes = {
	api: {
		articles: {
			rest$: (...rest: string[]) => S<typeof import('./routes/api/(group2)/articles/[...rest]/+server.ts')>
		} & S<typeof import('./routes/api/(group2)/articles/+server.ts')>
		users: {
			'user-[a]$': (a: string) => S<typeof import('./routes/api/users/user-[a]/+server.ts')>
			'<[id]>$': (id: string) => S<typeof import('./routes/api/users/[x+3c][id][x+3e]/+server.ts')>
		} & S<typeof import('./routes/api/users/+server.ts')>
		optional$: (optional?: string | null | undefined) => {
			others$: (others: string) => {
				'[a]+[b]$': (
					a: string,
					b: string
				) => S<typeof import('./routes/api/[[optional]]/(group)/[others=filter]/[a=param]+[b]/+server.ts')>
			} & S<typeof import('./routes/api/[[optional]]/(group)/[others=filter]/+server.ts')>
		}
	} & S<typeof import('./routes/api/+server.ts')>
}

const api = {} as APIRoutes['api']

let value = api.someFn(123)
api.POST({ hello: 'shiba' })