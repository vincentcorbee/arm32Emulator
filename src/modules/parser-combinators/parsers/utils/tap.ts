import { Parser } from "../../parser"
import { Result } from "../../types"

export const tap = <T>(parser: Parser<T>, fn: (result: Result<T>) => void) =>
  new Parser<T>((input, state) => {
    const result = parser.parse(input, state)

    fn(result)

    return result
  })