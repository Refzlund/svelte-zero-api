type StatefulAPI = {
	/** 
	 * In `ms` - time until being able to fetch again
	 * 
	 * Ex. whenever the user input changes, it will fetch as soon as possible at a rate limit.
	*/
	cooldown: number
} | {
	/**
	 * In `ms` - time it takes to fetch (resets when a new fetch is called)
	 * 
	 * Ex. when user input stops, the countdown begins.
	*/
	warmup: number
}

export function statefulAPI<Args extends any[], Result>(
	cb: (...args: Args) => Promise<Result> | Result,
	options: StatefulAPI
) {
	const { cooldown, warmup } = options as { cooldown?: number, warmup?: number}

	let timer = null as null | ReturnType<typeof setTimeout>
	
	let promise: Promise<Result> | undefined
	let resolve: (value: Result) => void

	function newPromise() {
		promise = new Promise(r => resolve = r)
	}

	$effect(() => {
		state.fetch(...state.args)
	})

	const fetch = async () => {
		const result = await cb(...state.args)
		state.result = result
		resolve(result)
		promise = undefined
		state.isLoading = false
	}

	const state = $state({
		args: [] as any as Args,
		result: undefined as undefined | Result,
		isLoading: false,
		fetch: async (...args: Args) => {
			state.isLoading = true
			if(!state.args.every((a, i) => a === args[i])) {
				state.args = args
			}
			
			if (cooldown && promise) {
				return promise
			} else if (cooldown) {
				newPromise()
				await new Promise((res) => setTimeout(res, cooldown))
			}
			else if (warmup) {
				if (timer) {
					clearTimeout(timer)
				}
				if(!promise) {
					newPromise()
				}
				timer = setTimeout(fetch, warmup)
				return promise
			}

			await fetch()
			return state.result
		}
	})

	return state
}