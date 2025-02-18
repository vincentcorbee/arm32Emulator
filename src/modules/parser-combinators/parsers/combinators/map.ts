import { Parser } from "../../parser"

export const map = <T, U>(parser: Parser<T>, fn: (value: T) => U) => new Parser<U>((input, { position }) => {
  const result = parser.parse(input, { position: { ...position } })

  if (!result.success) return result

  return { success: true, value: fn(result.value), position: { ...result.position } }
})