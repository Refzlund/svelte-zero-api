export function SSE(url: string) {

	let evtSource = new EventSource(url)

	evtSource.addEventListener('error', e => {
		state.isClosed = true
		state.isConnecting = false
		state.isOpen = false
	})
	evtSource.addEventListener('open', e => {
		state.isOpen = true
		state.isConnecting = false
		state.isClosed = false
	})
	evtSource.addEventListener('__END__', close)

	function close() {
		evtSource.close()
		state.isConnecting = false
		state.isOpen = false
		state.isClosed = true
		evtSource.dispatchEvent(new CustomEvent('close'))
		evtSource = null as any
	}

	let state = $state({
		isClosed: false,
		isConnecting: true,
		isOpen: false
	})

	let on = false
	const proxy = new Proxy(state, {
		get: (target, key) => {
			if (key === 'on') {
				on = true
				return proxy
			}
			if (!on) {
				switch (key) {
					case 'onClose':
						return (cb: () => void) => {
							evtSource.addEventListener('close', cb)
						}
					case 'onOpen':
						return (cb: () => void) => {
							evtSource.addEventListener('open', cb)
						}
					case 'onError':
						return (cb: () => void) => {
							evtSource.addEventListener('error', cb)
						}
					case 'close':
						return close
					default:
						return target[key]
				}
			}
			else {
				on = false
				return (cb: (data: any) => void) => {
					evtSource.addEventListener(key.toString(), (e) => {
						let isJSON = (e.data.startsWith('{') && e.data.endsWith('}')) || (e.data.startsWith('[') && e.data.endsWith(']'))
						cb(isJSON ? JSON.parse(e.data) : e.data)
					})
					return proxy
				}
			}
		},
	})
	return proxy
}