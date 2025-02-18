import { map, sequence } from "../../parser-combinators";
import { dot } from "./tokens";
import { upperOrLower } from "./upper-or-lower";

export const directiveName = (name: string) => map(
  sequence(
    dot,
    upperOrLower(name)
  ),
  value => ({ type: 'DirectiveName', value: value[1] })
)