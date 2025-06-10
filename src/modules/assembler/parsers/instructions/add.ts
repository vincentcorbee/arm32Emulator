import { ADD } from '../../../../constants/mnemonics';
import { map, sequence, whitespace } from '../../../parser-combinators';
import { optionalWhitespace } from '../optional-whitespace';
import { register } from '../register';
import { condition } from '../condition';
import { setConditionCodes } from '../set-condition-codes';
import { opCode } from '../op-code';
import { operand2 } from '../operand-2';
import { comma } from '../tokens';

/* ADD{S}{cond} {Rd}, Rn, Operand2 */
export const add = map(
  sequence(
    optionalWhitespace,
    opCode(ADD),
    setConditionCodes,
    condition,
    whitespace,
    register,
    comma,
    optionalWhitespace,
    register,
    optionalWhitespace,
    comma,
    optionalWhitespace,
    operand2,
  ),
  (value) => {
    const { value: opCode, mnemonic } = value[1];
    const s = value[2];
    const cond = value[3].value;
    const rd = value[5];
    const rn = value[8];
    const operand2 = value[12];
    const i = operand2.type === 'ImmidiateExpression' ? 1 : 0;

    return {
      type: 'Instruction',
      mnemonic,
      opCode,
      i,
      rd: rd.value,
      rn: rn.value,
      s,
      cond,
      operand2,
    };
  },
);
