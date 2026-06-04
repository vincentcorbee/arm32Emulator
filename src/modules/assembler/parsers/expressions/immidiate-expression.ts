import { chain, map } from '../../../parser-combinators';
import { createNode } from '../mappers';
import { number } from '../number';
import { pound } from '../tokens';

export const ImmediateExpression = map(
  chain(pound, () => number),
  createNode('ImmediateExpression'),
);
