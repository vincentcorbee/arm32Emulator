import { map, sequence, many, whitespace, or, lazy } from "../../../parser-combinators";
import { directiveName } from "../directive-name";
import { expression } from "../expressions";
import { optionalWhitespace } from "../optional-whitespace";
import { comma } from "../tokens";

const list: any = lazy(() =>
  map(
    or(
      sequence(
        expression,
        optionalWhitespace,
        comma,
        optionalWhitespace,
        list
      ),
      expression
    ),
    value => {
      if (Array.isArray(value)) {
        const listItem = value[0]
        const list = [listItem, ...value[4].value]

        return {
          type: 'List',
          value: list
        }
      }

      return {
        type: 'List',
        value: [value]
      }
    }
  )
)

export const wordDirective = map(
  sequence(
    directiveName('word'),
    many(whitespace),
    list
  ),
  value => ({ type: 'Directive', name: value[0].value, value: value[2].value  })
)