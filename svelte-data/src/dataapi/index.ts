import { DataAPI as DataAPI_ } from './dataapi.type'

export class DataAPI {
	constructor() {
		throw new Error('Cannot construct DataAPI. Please use `dataAPI` method to instantiate.')
	}
}
export interface DataAPI extends DataAPI_<unknown, unknown, unknown> { }

export {
	dataAPI
} from './datasapi.svelte'