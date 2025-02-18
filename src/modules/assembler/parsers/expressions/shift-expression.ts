import { either } from "../../../parser-combinators";
import { leftAssociative } from "./left-associative";
import { createBinaryExpressionNode } from "../mappers";
import { multiplicativeExpression } from "./multiplicative-expression";
import { shiftLeft, shiftRight } from "../tokens";

export const shiftExpression = leftAssociative(
  multiplicativeExpression,
  either(
    shiftLeft,
    shiftRight
  ),
  createBinaryExpressionNode
)
