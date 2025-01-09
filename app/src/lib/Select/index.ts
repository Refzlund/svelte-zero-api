import Select from './Select.svelte'
import Option from './Option.svelte'

Object.assign(Select, { Option })

export default Select as typeof Select & { Option: typeof Option }