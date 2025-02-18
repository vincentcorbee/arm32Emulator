import { either, map, char, string } from "../parser-combinators"
import { multilineComment, comment } from "./parsers/comments"
import { not } from "./parsers/not"
import { doubleQuote, endMultilineComment, stringConstant } from "./parsers/tokens"

export type PreProcessOptions = {
  commentIdentifier?: string
}

export const preProcess = (src: string, options?: PreProcessOptions) => {
  const { commentIdentifier = ';' } = options || {}
  let current = 0
  let value = ''
  let state = { position: { index: 0, line: 1, column: 1 } }

  while (current < src.length) {
    const result = either(
      map(stringConstant, value => `"${value.value}"`),
      map(multilineComment, () => ''),
      map(comment(commentIdentifier), () => ''),
      map(either(
        not(char(commentIdentifier)),
        not(doubleQuote),
        not(endMultilineComment)
      ),
      value => value.replace(/[ ]+/g, ' '))
    ).parse(src, state)

    if (!result.success) break

    current = result.position.index

    value += result.value

    state.position =  { ...result.position }
  }

  return { success: true, value, ...state }
}