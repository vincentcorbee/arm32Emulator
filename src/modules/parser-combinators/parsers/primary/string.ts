import { Parser } from "../../parser"

export const string = (needle: string) => new Parser<string>((input, { position }) => {
  const { index, column, line } = position

  if (input.startsWith(needle, index)) {
    return { success: true, value: needle, position: { index: index + needle.length, column: column + needle.length, line } }
  }

  return { success: false, message: `Expected ${needle}`, position: { ...position } }
})