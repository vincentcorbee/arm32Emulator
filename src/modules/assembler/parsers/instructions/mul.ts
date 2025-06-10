import { MUL } from '../../../../constants/mnemonics';
import { map, sequence, whitespace } from '../../../parser-combinators';
import { optionalWhitespace } from '../optional-whitespace';
import { register } from '../register';
import { condition } from '../condition';
import { setConditionCodes } from '../set-condition-codes';
import { opCode } from '../op-code';
import { comma } from '../tokens';

/* MUL{cond}{S} Rd,Rm,Rs */
export const mul = map(
  sequence(
    optionalWhitespace,
    opCode(MUL),
    condition,
    setConditionCodes,
    whitespace,
    register,
    comma,
    optionalWhitespace,
    register,
    optionalWhitespace,
    comma,
    optionalWhitespace,
    register,
  ),
  (value) => {
    const { value: opCode, mnemonic } = value[1];
    const cond = value[2].value;
    const s = value[3];
    const rd = value[5].value;
    const rm = value[8].value;
    const rs = value[12].value;

    return {
      type: 'Instruction',
      mnemonic,
      opCode,
      cond,
      s,
      rd,
      rm,
      rs,
    };
  },
);
