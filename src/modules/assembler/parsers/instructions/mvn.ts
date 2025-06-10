import { MVN } from '../../../../constants/mnemonics';
import { map, sequence, whitespace } from '../../../parser-combinators';
import { opCode } from '../op-code';
import { operand2 } from '../operand-2';
import { register } from '../register';
import { comma } from '../tokens';

export const mvn = map(sequence(opCode(MVN), whitespace, register, comma, whitespace, operand2), (value) => {
  const { value: opCode, mnemonic } = value[0];
  const rd = value[2].value;
  const operand2 = value[5];
  const i = operand2.type === 'ImmidiateExpression' ? 1 : 0;

  return {
    type: 'Instruction',
    mnemonic,
    opCode,
    i,
    rd,
    operand2,
  };
});
