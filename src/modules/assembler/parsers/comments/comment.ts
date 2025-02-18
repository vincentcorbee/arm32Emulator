import { map, sequence, many0, regexp, char } from "../../../parser-combinators";

export const comment = (identifier: string) => map(
  sequence(
    char(identifier),
    many0(regexp(/./))
  ),
  value => ({ type: 'Comment', value: value[1].join('') })
)