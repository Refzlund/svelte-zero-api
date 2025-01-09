import { 
	type AutoUpdateOptions,
	type ComputePositionConfig,
	type ComputePositionReturn,
	autoUpdate,
	computePosition
} from '@floating-ui/dom'
import { onDestroy } from 'svelte'

export {
	offset,
	shift,
	flip,
	size,
	autoPlacement,
	hide,
	inline,
	arrow
} from '@floating-ui/dom'

interface Options extends Partial<ComputePositionConfig> {
	autoUpdate?: AutoUpdateOptions
}

/** Svelte 5, $effect-driven `@floating-ui/dom`
 * 
 * @example
 * ```html
 * <script lang='ts'>
 *     ...
 * 
 *     let float = floatingUI({
 *         placement: 'top',
 *         middleware: [
 *             flip(),
 *             shift()
 *         ]
 *     }).then(...) // optional
 * </script>
 *
 * <span use:float.ref onmouseenter={...}>
 *     This is some text
 * </span>
 * {#if showTooltip}
 *     <span use:float> My tooltip </span>
 * {/if}
 * ```
*/
export function floatingUI(options: Options) {
	let ref = $state(undefined as HTMLElement | undefined)
	let float = $state(undefined as HTMLElement | undefined)
	let then = $state(undefined as ((computed: ComputePositionReturn) => void) | undefined)
	let tether = $state(undefined as HTMLElement | undefined)

	function setFloat(node: HTMLElement) {
		float = node
		return {
			destroy: () => {
				if (float === node) float = undefined
			}
		}
	}

	const value = {
		/**
		 * `use:float.ref` on what you want the reference element
		 * that the floating element positions relative to
		 */
		ref(node: HTMLElement) {
			ref = node
			return {
				destroy: () => {
					if (ref === node) ref = undefined
				}
			}
		},
		/**
		 * Any additional logic according to https://floating-ui.com/docs
		 */
		then(cb: (computed: ComputePositionReturn) => void) {
			then = cb
			return this
		},
		/**
		 * You can do use:float.tether and do float.untether()
		 * to attach the floating element to a temporary target.
		 */
		tether(node: HTMLElement) {
			tether = node
			return {
				destroy: () => {
					if (tether === node) tether = undefined
				}
			}
		},
		/**
		 * You can do use:float.tether and do float.untether()
		 * to attach the floating element to a temporary target.
		*/
		untether() {
			tether = undefined
		}
	}

	Object.assign(setFloat, value)

	const compute = (options: Options) => () => {
		if (!ref || !float) return

		options.strategy ??= 'absolute'

		computePosition(tether || ref, float, options).then((v) => {
			Object.assign(float!.style, {
				position: options.strategy!,
				left: `${v.x}px`,
				top: `${v.y}px`
			})

			then?.(v)
		})
	}

	let cleanup: (() => void) | undefined

	onDestroy(() => cleanup?.())

	$effect.pre(() => {
		cleanup?.()
		if (!ref || !float) return
		compute(options)
		cleanup = autoUpdate(tether || ref, float, compute(options), options.autoUpdate)
	})

	type SvelteFloatingUI = typeof setFloat & typeof value
	return setFloat as SvelteFloatingUI
}