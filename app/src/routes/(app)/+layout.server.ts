import type { LayoutServerLoad } from '#types/(app)/$types.d.ts'

export const load: LayoutServerLoad = (event) => {
	return {
		mobile: event.locals.mobile
	}
}