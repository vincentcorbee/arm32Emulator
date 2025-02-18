import { SP } from "../../../../constants/codes";
import { POP } from "../../../../constants/mnemonics";
import { map, sequence, whitespace } from "../../../parser-combinators";
import { condition } from "../condition";
import { opCode } from "../op-code";
import { registerList } from "../register-list";
import { leftCurlyBrace, rightCurlyBrace } from "../tokens";

/* PUSH{cond} <Rlist> */
export const pop = map(
  sequence(
    opCode(POP),
    condition,
    whitespace,
    map(sequence(
      leftCurlyBrace,
      registerList,
      rightCurlyBrace
    ), value => value[1])
  ),
  value => {
    const { value: opCode, mnemonic } = value[0]
    const cond = value[1].value
    const l = 1
    const p = 0
    const u = 1
    const rn = SP
    const w = 1
    const registerList = value[3].value

    return {
      type: 'Instruction',
      opCode,
      mnemonic,
      cond,
      l,
      p,
      u,
      w,
      rn,
      registerList
    }
  }
)