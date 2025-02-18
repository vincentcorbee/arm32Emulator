import { Parser } from "../../parser"

export const whitespace = new Parser<string>((input, { position }) => {
  const { index, column, line } = position
  const regexp = /[ \t]/

  let nextIndex = index
  let value = ''

  let char = input[nextIndex]

  while (char && regexp.test(char)) {
    value += char

    char = input[++nextIndex]
  }

  if (value.length === 0) return { success: false, message: 'Expected whitespace', position: { ...position } }

  return { success: true, value, position: { index: nextIndex, column: column + value.length, line } }
})