import { map, sequence, whitespace } from "../../../parser-combinators";
import { labelExpression } from "../expressions/label-expression";
import { condition } from "../condition";
import { B } from "../../../../constants/mnemonics";
import { opCode } from "../op-code";

export const b = map(
  sequence(
    opCode(B),
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
      l: 0,
      cond: value[1].value,
      offset: value[3].value
    }
  }
)