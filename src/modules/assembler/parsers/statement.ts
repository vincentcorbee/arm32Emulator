import { either, many, many0, map, peek } from "../../parser-combinators"
import { sequence } from "../../parser-combinators/parsers/combinators/sequence"
import { newline } from "../../parser-combinators/parsers/primary/newline"
import { directive } from "./directives"
import { instruction } from "./instructions"
import { label } from "./label"
import { optionalWhitespace } from "./optional-whitespace"
import { parseSymbolAssignment } from "./symbol-assignment"

export const statement = map(
  sequence(
    optionalWhitespace,
    many0(
      map(
        sequence(
          label,
          optionalWhitespace
        ),
        value => value[0]
      )
    ),
    either(
      instruction,
      directive,
      parseSymbolAssignment,
      map(
        peek(newline),
        () => ({ type: 'EmptyStatement' })),
    ),
    optionalWhitespace,
    many(newline)
  ),
  value => {
    if (value[1].length > 0) {
      return {
        type: 'LabeledStatement',
        labels: value[1],
        value: value[2]
      }
    }

    return value[2]
  }
)