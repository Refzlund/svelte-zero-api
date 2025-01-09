export const optionalSlug = /^\[\[([^\]]+)\]\]$/
export const restSlug = /^\[\.\.\.([^\]]+)\]$/
export const simpleSlug = /^\[([^\]]+)\]$/
export const complexSlug = /\[([^\]]+)\]/

export type Slugged<T, K extends string = `${string}$`> = {
	[Key in K]: (...args: any[]) => T
}