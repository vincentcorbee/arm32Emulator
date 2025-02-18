import { map, sequence } from "../../../parser-combinators";
import { parseAdditiveExpression } from "./additive-expression";

export const expression = map(
  sequence(
    parseAdditiveExpression
  ),
  value => value[0]
)