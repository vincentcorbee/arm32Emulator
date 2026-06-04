import { lazy, map, optional, sequence } from '../../../parser-combinators';
import { expression } from './expression';
import { optionalWhitespace } from '../optional-whitespace';
import { leftParen, rightParen } from '../tokens';

export const parenthesizedExpression = map(
  /* If lazy is omitted, there is a circular dependency between expression and parenthesizedExpression */
  lazy(() => sequence(leftParen, optionalWhitespace, optional(expression), optionalWhitespace, rightParen)),
  (value) => value[2],
);
