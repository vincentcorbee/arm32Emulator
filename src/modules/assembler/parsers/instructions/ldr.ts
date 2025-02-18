
import { PC } from "../../../../constants/codes"
import { OpCodeNameToCode } from "../../../../constants/maps"
import { LDR, LDRB } from "../../../../constants/mnemonics"
import { map, sequence, optional, whitespace, either } from "../../../parser-combinators"
import { addressExpression } from "../address-expression"
import { offsetAddressing } from "../offset-addressing"
import { opCode } from "../op-code"
import { optionalWhitespace } from "../optional-whitespace"
import { register } from "../register"
import { B, comma } from "../tokens"

/* LDR{cond}{B}{T} Rd,<Address> */
export const ldr = map(
  sequence(
    opCode(LDR),
    optional(B),
    whitespace,
    register,
    comma,
    optionalWhitespace,
    either(
      addressExpression,
      offsetAddressing
    )),
  value => {
    const rd = value[3].value
    const type = value[1]
    const mnemonic = type === 'B' ? LDRB : LDR
    const byteWord = type === 'B' ? 1 : 0
    const opCode = OpCodeNameToCode[mnemonic]

    if (value[6].type === 'LabelExpression') {
      return {
        type: 'Instruction',
        mnemonic,
        opCode,
        rd,
        i: 1,
        rn: PC,
        offset: value[6],
        byteWord
      }
    }

    const { rn, writeBack, offsetMode: i, prePost, offset } = value[6]

    return {
      type: 'Instruction',
      mnemonic,
      opCode,
      i,
      rd,
      rn,
      offset,
      byteWord,
      writeBack,
      prePost
    }
  }
)