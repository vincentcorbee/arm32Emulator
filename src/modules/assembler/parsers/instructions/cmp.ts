import { CMP } from "../../../../constants/mnemonics";
import { map, sequence, whitespace } from "../../../parser-combinators";
import { optionalWhitespace } from "../optional-whitespace";
import { register } from "../register";
import { opCode } from "../op-code";
import { operand2 } from "../operand-2";
import { comma } from "../tokens";

export const cmp = map(
  sequence(
    opCode(CMP),
    whitespace,
    register,
    optionalWhitespace,
    comma,
    optionalWhitespace,
    operand2
  ),
  value => {
    const { value: opCode, mnemonic } = value[0]
    const rn = value[2].value
    const operand2 = value[6]
    const i = operand2.type === 'ImmidateExpression' ? 1 : 0

    return {
      type: 'Instruction',
      mnemonic,
      opCode,
      i,
      rn,
      operand2,
    }
  }
)