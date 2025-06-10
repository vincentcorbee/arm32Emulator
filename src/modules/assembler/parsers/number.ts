import { either, map } from '../../parser-combinators';
import { createNode } from './mappers';
import { binary, decimal, hexadecimal } from './tokens';

export const number = map(either(hexadecimal, decimal, binary), (value) => createNode('Number')(value));
