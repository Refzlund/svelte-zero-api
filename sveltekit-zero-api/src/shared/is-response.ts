import type { KitResponse } from '../server/http'

export function isResponse<T extends KitResponse | Response>(response: T | unknown): response is T {
	return response instanceof Response || (<Response>response)?.headers instanceof Headers
}
