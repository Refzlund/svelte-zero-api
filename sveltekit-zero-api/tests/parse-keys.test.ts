import { test, expect } from 'bun:test'
import { parseItems, parseKeys } from '../src/utils/parse-keys'

test('parseKeys', () => {
	let result = parseKeys('abc[123][\'321\'].here.["hello"][`yas`].yep.0.derp')
	expect(result).toEqual(['abc', 123, '321', 'here', 'hello', 'yas', 'yep', 0, 'derp'])
})

test('parseItems', () => {
	let result = parseItems([
		['abc[0][\'321\'].here.["hello"][`yas`].yep.2.derp', 'some-value']
	])

	expect(result).toEqual({
		abc: [
			{
				'321': {
					'here': {
						'hello': {
							'yas': {
								yep: [
									,
									,
									{
										derp: 'some-value'
									}
								]
							}
						}
					}
				}
			}
		]
	})
})