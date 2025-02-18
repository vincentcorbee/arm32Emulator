import { either, map, optional, sequence } from "../../../parser-combinators";
import { createUnaryExpressionNode } from "../mappers";
import { minus, not } from "../tokens";
import { primaryExpression } from "./primary-expression";

export const unaryExpression = map(
  sequence(
    optional(
      either(
        minus,
        not
      )
    ),
    primaryExpression
), value => {
  if (value[0]) return createUnaryExpressionNode(value[0], value[1])

  return value[1]
});