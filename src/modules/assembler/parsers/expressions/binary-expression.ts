import { either } from "../../../parser-combinators";
import { leftAssociative } from "./left-associative";
import { createBinaryExpressionNode } from "../mappers";
import { shiftExpression } from "./shift-expression";
import { and, exclamationMark, or, xor } from "../tokens";

export const binaryExpression = leftAssociative(
  shiftExpression,
  either(
    or,
    and,
    xor,
    exclamationMark),
  createBinaryExpressionNode
)