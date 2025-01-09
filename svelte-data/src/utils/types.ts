/** Takes all properties of T, and deeply ensure they become U */
export type MapDeepTo<T, U, Ignore = Date> = {
	[K in keyof T]?: NonNullable<T[K]> extends Record<PropertyKey, any>
	? T[K] extends Ignore ? NonNullable<U> : MapDeepTo<T[K], U>
	: T[K] extends any[]
	? Array<MapDeepTo<T[K][number], U>>
	: NonNullable<U>
}