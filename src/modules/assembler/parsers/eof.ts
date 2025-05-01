import { Parser } from "../../parser-combinators"

export const eof = new Parser<null>((input, state) => {
  const { index, column, line } = state.position

  if (index !== input.length) return { success: false, message: `Unexpected ${input[index]} token at ${index}:${column}:${line}`, position: { ...state.position } }

  return { success: true, value: null, position: { ...state.position } }
})