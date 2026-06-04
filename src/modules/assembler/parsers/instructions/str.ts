import { STR, STRB } from '../../../../constants/mnemonics';
import { map, sequence, whitespace, optional } from '../../../parser-combinators';
import { optionalWhitespace } from '../optional-whitespace';
import { register } from '../register';
import { condition } from '../condition';
import { opCode } from '../op-code';
import { offsetAddressing } from '../offset-addressing';
import { B, comma, T } from '../tokens';
import { OpCodeNameToCode } from '../../../../constants/maps';

/* STR{cond}{B}{T} Rd,<Address> */
export const str = map(
  sequence(
    opCode(STR),
    condition,
    optional(B),
    optional(T),
    whitespace,
    register,
    comma,
    optionalWhitespace,
    offsetAddressing,
  ),
  (value) => {
    const cond = value[1];
    const rd = value[5].value;
    const type = value[2];
    const mnemonic = type === 'B' ? STRB : STR;
    const opCode = OpCodeNameToCode[mnemonic];
    const { rn, writeBack, offsetMode: i, prePost, offset } = value[8];

    return {
      type: 'Instruction',
      mnemonic,
      cond,
      opCode,
      i,
      rd,
      rn,
      offset,
      writeBack,
      prePost,
    };
  },
);
