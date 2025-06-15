import { map, chain } from '../../../parser-combinators';
import { expression } from './expression';
import { createNode } from '../mappers';
import { pound } from '../tokens';

export const ImmediateExpression = map(
  chain(pound, () => expression),
  createNode('ImmediateExpression'),
);
