import { SVC } from "../../../../constants/mnemonics";
import { map, sequence, whitespace } from "../../../parser-combinators";
import { immidiateExpression } from "../expressions/immidiate-expression";
import { opCode } from "../op-code";

export const svc = map(
  sequence(
    opCode(SVC),
    whitespace,
    immidiateExpression
  ),
  value =>
  {
    const { value: opCode, mnemonic } = value[0]
    return {
      type: 'Instruction',
      mnemonic,
      opCode,
      comment: value[2]
    }
  }
)