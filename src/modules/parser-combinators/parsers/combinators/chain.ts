import { Parser } from "../../parser"

export const chain = <T = any, U = any>(parser: Parser, fn: (value: T) => Parser<U>) => new Parser((input, state) => {
  const result = parser.parse(input, state)

  if (!result.success) return result

  const nextParser = fn(result.value)

  return nextParser.parse(input, { position: { ...result.position } })
})