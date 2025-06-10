import { or, map, sequence } from '../../parser-combinators';
import { immidiateExpression } from './expressions/immidiate-expression';
import { register } from './register';
import { shift } from './shift';

export const operand2 = or(
  immidiateExpression,
  map(sequence(register, shift), (value) => ({
    ...value[0],
    shift: value[1],
  })),
);
