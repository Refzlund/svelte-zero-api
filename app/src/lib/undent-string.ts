export function undentString(str: string) {
	let shortestWhitespace = Infinity
	let lines = str.split('\n')

	let start = 0,
		end = lines.length

	const nonemptyLine = /[^\s]/
	const whitespaceRegex = /^([\s]+)\S/

	for (let i = 0; i < lines.length; i++) {
		if (nonemptyLine.test(lines[i]!) == false) {
			start++
		} else {
			break
		}
	}

	for (let i = lines.length - 1; i >= 0; i--) {
		if (nonemptyLine.test(lines[i]!) == false) {
			end--
		} else {
			break
		}
	}

	lines = lines.slice(start, end)

	for (const line of lines) {
		let match = whitespaceRegex.exec(line)
		if (!match && !nonemptyLine.test(line)) {
			continue
		}

		let length = match ? match[1]!.length : 0

		if (length < shortestWhitespace) {
			shortestWhitespace = length
		}
	}

	return lines.map((line) => line.slice(shortestWhitespace).replaceAll('\t', '    ')).join('\n')
}