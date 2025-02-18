import { map, sequence, many, whitespace, optional } from "../../../parser-combinators";
import { directiveName } from "../directive-name";
import { stringConstant } from "../tokens";

export const textDirective = map(
  sequence(
    directiveName('text'),
    optional(sequence(
      many(whitespace),
      stringConstant
    ))
  ),
  (value) => {
    const name = value[1] ? value[1][1].value : ''

    return {
      type: 'Directive',
      name: value[0].value,
      value: name
    }
  }
)