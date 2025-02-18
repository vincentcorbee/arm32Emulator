import { Parser } from "../../parser"

export const and = <T = string, U = string>(parserA: Parser<T>, parserB: Parser<U>) => new Parser<[T, U]>((input, state) => {
  const resultA = parserA.parse(input, state)

  if (!resultA.success) return resultA

  const resultB = parserB.parse(input, { position: { ...resultA.position } })

  if (!resultB.success) return resultB

  return { success: true, value: [resultA.value, resultB.value], position: { ...resultB.position } }
})