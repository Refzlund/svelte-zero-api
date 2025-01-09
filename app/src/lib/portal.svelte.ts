import { onDestroy } from 'svelte'

/**
 * Portals the element as a child to another element.
 * 
 * If none is specified, it will be appended to the document body.
*/
export function portal(
	node: HTMLElement,
	/** @default document.body */
	target?: HTMLElement
) {
	node.parentElement?.removeChild(node)
	$effect.pre(() => {
		(target ?? document.body).appendChild(node)
	})
	onDestroy(() => {
		let parent = target ?? document.body
		if(!node || node.parentElement !== parent)
			return
		parent?.removeChild(node)
		node.remove()
	})
}


