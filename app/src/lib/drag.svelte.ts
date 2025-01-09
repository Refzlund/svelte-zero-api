export function drag({ minX = -Infinity, maxX = Infinity, snap = true } = {}) {
	let state = $state({
		x: 0,
		y: 0,
		moving: false,
		snap,
		minX,
		maxX,
		action
	})

	$effect.pre(() => {
		state.x = Math.max(
			state.minX,
			Math.min(state.maxX, state.x)
		)

		if(!state.moving) {
			if (state.snap && (state.minX !== -Infinity || state.maxX !== Infinity)) {
				// snap state.x to minX or maxX
				let distMin = Math.abs(state.x - state.minX)
				let distMax = Math.abs(state.x - state.maxX)

				if (distMin < distMax) {
					state.x = state.minX
				} else {
					state.x = state.maxX
				}
			}
		}
	})

	function action(node: HTMLElement) {
		function stop() {
			window.removeEventListener('mousemove', move)
			window.removeEventListener('mouseup', stop)
			window.removeEventListener('touchmove', move)
			window.removeEventListener('touchend', stop)
			state.moving = false
		}

		function start() {
			window.addEventListener('mousemove', move)
			window.addEventListener('mouseup', stop)
			window.addEventListener('touchmove', move)
			window.addEventListener('touchend', stop)

			state.moving = true
		}

		let previousTouch: Touch
		function move(e: MouseEvent | TouchEvent) {
			if ('movementX' in e) {
				state.x += e.movementX
				state.y += e.movementY
				return
			}

			if (previousTouch) {
				state.x += e.touches[0].pageX - previousTouch?.pageX
				state.y += e.touches[0].pageY - previousTouch?.pageY
			}

			previousTouch = e.touches[0]
		}

		node.addEventListener('mousedown', start)
		node.addEventListener('touchstart', start)
		return {
			destroy() {
				node.removeEventListener('mousedown', start)
				node.removeEventListener('touchstart', start)
				stop()
			}
		}
	}

	return state
}
