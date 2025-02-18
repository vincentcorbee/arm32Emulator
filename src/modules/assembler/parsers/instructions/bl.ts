import { map, sequence, whitespace } from "../../../parser-combinators";
import { labelExpression } from "../expressions/label-expression";
import { condition } from "../condition";
import { BL } from "../../../../constants/mnemonics";
import { opCode } from "../op-code";

export const bl = map(
  sequence(
    opCode(BL),
    condition,
    whitespace,
    labelExpression
  ),
  value =>
  {
    const { value: opCode, mnemonic } = value[0]

    return {
      type: 'Instruction',
      opCode,
      mnemonic,
      l: 1,
      cond: value[1].value,
      offset: value[3].value
    }
  }
)