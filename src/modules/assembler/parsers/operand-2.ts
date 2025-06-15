import { or, map, sequence } from '../../parser-combinators';
import { ImmediateExpression } from './expressions/immidiate-expression';
import { register } from './register';
import { shift } from './shift';

export const operand2 = or(
  ImmediateExpression,
  map(sequence(register, shift), (value) => ({
    ...value[0],
    shift: value[1],
  })),
);
