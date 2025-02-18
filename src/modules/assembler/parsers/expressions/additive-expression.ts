import { either } from "../../../parser-combinators";
import { binaryExpression } from "./binary-expression";
import { leftAssociative } from "./left-associative";
import { createBinaryExpressionNode } from "../mappers";
import { minus, plus } from "../tokens";

export const parseAdditiveExpression = leftAssociative(
  binaryExpression,
  either(
    plus,
    minus
  ),
  createBinaryExpressionNode
)