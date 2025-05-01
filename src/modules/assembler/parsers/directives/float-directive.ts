import { many, map, optional, or, sequence, whitespace } from "../../../parser-combinators";
import { directiveName } from "../directive-name";
import { decimal, dot, minus, plus } from "../tokens";
import { upperOrLower } from "../upper-or-lower";

const sign = or(
  minus,
  plus
)

const integer = map(sequence(
  optional(sign, '+'),
  decimal
), ([sign, number]) => `${sign}${number}`)

const fraction = map(sequence(dot, decimal), value => `${value[0]}${value[1]}`)

const exponent = map(sequence(
  upperOrLower('e'),
  optional(sign, '+'),
  decimal
), ([e, sign, number ]) => `${e}${sign}${number}`)

export const floatDirective = map(
  sequence(
    directiveName('float'),
    many(whitespace),
    optional(integer, 0),
    optional(fraction, 0),
    optional(exponent, 0)
  ),
  value => {
    const [name, _whitespace, integer, fraction, exponent] = value

    return {
      type: 'Directive',
      name: name.value,
      value: Number(`${integer}${fraction}${exponent}`)
    }
  }
)