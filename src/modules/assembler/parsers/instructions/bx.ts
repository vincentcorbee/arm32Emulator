import { map, sequence, whitespace } from '../../../parser-combinators';
import { BX } from '../../../../constants/mnemonics';
import { opCode } from '../op-code';
import { register } from '../register';
import { condition } from '../condition';

export const bx = map(sequence(opCode(BX), condition, whitespace, register), (value) => {
  const { value: opCode, mnemonic } = value[0];
  const cond = value[1].value;

  return {
    type: 'Instruction',
    opCode,
    mnemonic,
    cond,
    rn: value[3].value,
  };
});
