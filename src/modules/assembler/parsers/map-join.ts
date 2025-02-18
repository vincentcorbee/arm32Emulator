import { Parser } from "../../parser-combinators"

export const mapJoin = (parser: Parser<string[]>) => new Parser<string>((input, state) => {
  const result = parser.parse(input, state)

  if (!result.success) return result

  const { value } = result

  return { success: true, value: value.join(''), position: { ...result.position } }
})