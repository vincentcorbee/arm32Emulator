import { STM } from "../../../../constants/mnemonics";
import { either, map, optional, sequence, whitespace } from "../../../parser-combinators";
import { condition } from "../condition";
import { opCode } from "../op-code";
import { optionalWhitespace } from "../optional-whitespace";
import { register } from "../register";
import { registerList } from "../register-list";
import { comma, exclamationMark, leftCurlyBrace, rightCurlyBrace } from "../tokens";
import { upperOrLower } from "../upper-or-lower";

/* STM{cond}<FD|ED|FA|EA|IA|IB|DA|DB> Rn{!},<Rlist>{^} */
export const stm = map(
  sequence(
    opCode(STM),
    condition,
    map(either(
      upperOrLower('FD'),
      upperOrLower('ED'),
      upperOrLower('FA'),
      upperOrLower('EA'),
      upperOrLower('IA'),
      upperOrLower('IB'),
      upperOrLower('DA'),
      upperOrLower('DB')
    ), value => {
      switch (value) {
        case 'FA':
        case 'IB':
          return {
            type: value,
            l: 0,
            p: 1,
            u: 1,
          }
        case 'EA':
        case 'IA':
          return {
            type: value,
            l: 0,
            p: 0,
            u: 1,
          }
        case 'FD':
        case 'DB':
          return {
            type: value,
            l: 0,
            p: 1,
            u: 0,
          }
        case 'ED':
        case 'DA':
          return {
            type: value,
            l: 0,
            p: 0,
            u: 0,
          }
      }
    }),
    whitespace,
    register,
    optional(exclamationMark),
    optionalWhitespace,
    comma,
    optionalWhitespace,
    map(sequence(
      leftCurlyBrace,
      registerList,
      rightCurlyBrace
    ), value => value[1])
  ),
  value => {
    const { value: opCode, mnemonic } = value[0]
    const cond = value[1].value
    const { l, p, u } = value[2]
    const rn = value[4].value
    const w = value[5] ? 1 : 0
    const registerList = value[9].value

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