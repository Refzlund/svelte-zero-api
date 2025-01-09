export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {}

/**
 * A utiltiy type that removes never keys,
 * and adds ? to optional keys
*/
export type FixKeys<T> = {
	[K in keyof T as[T[K]] extends [never] ? never : undefined extends T[K] ? never : K]: T[K]
} & {
	[K in keyof T as[T[K]] extends [never] ? never : undefined extends T[K] ? K : never]?: T[K]
}

export type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never

export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
export type IsAny<T> = IfAny<T, true, never>

export type IsUnknown<T> = IsAny<T> extends never ? (unknown extends T ? true : never) : never

/** Turn type into a promise, if not already — and type catch */
export type Promisify<T, Catch = never> = Omit<T extends Promise<infer U> ? Promise<IfAny<U, unknown, U>> : Promise<IfAny<T, unknown, T>>, 'catch'> & {
	catch: <R = never>(onrejected: (error: [Catch] extends [never] ? unknown : Catch) => R | PromiseLike<R>) => Promise<Awaited<T> | R>
}

type T = Awaited<Promisify<any>>

export type AwaitAll<
	T extends
	| (Promise<unknown> | unknown)[]
	| readonly (Promise<unknown> | unknown)[]
> = T extends [infer U, ...infer V] ? [Awaited<U>, ...AwaitAll<V>] : T

export type AnyAsUnknownAll<
	T extends unknown[] | readonly unknown[]
> = T extends [infer U, ...infer V] ? [IfAny<U, unknown, U>, ...AnyAsUnknownAll<V>] : T

/** Takes all properties of T, and deeply ensure they become U */
export type MapDeepTo<T, U, Ignore = Date> = {
	[K in keyof T]?: NonNullable<T[K]> extends Record<PropertyKey, any>
	? T[K] extends Ignore ? NonNullable<U> : MapDeepTo<T[K], U>
	: T[K] extends any[]
	? Array<MapDeepTo<T[K][number], U>>
	: NonNullable<U>
}

export type MaybePromise<T> = T | Promise<T>

export type KeyOf<T, Key> = Key extends keyof T ? T[Key] : never

export type DeepPartial<T> = T extends Record<PropertyKey, any> ? {
	[K in keyof T]?: DeepPartial<T[K]>
} : T