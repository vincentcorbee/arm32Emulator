import { either } from '../../../parser-combinators';
import { leftAssociative } from './left-associative';
import { createBinaryExpressionNode } from '../mappers';
import { unaryExpression } from './unary-expression';
import { div, mod, mul } from '../tokens';

export const multiplicativeExpression = leftAssociative(
  unaryExpression,
  either(mul, div, mod),
  createBinaryExpressionNode,
);
