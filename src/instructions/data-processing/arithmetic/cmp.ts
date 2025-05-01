import { AL } from "../../../constants/codes/condition";
import { CMP } from "../../../constants/codes/op-codes";

export type CmpArgs = { cond?: number; rn: number; i: number; operand2: number }

export const cmp = (args: CmpArgs) => {
  const { rn, i, operand2, cond = AL } = args
  const s = 1

  let value = (cond << 28) >>> 0

  value = (value | (CMP << 21)) >>> 0
  value = (value | s << 20) >>> 0

  if (i) {
    value = (value | i << 25) >>> 0
    value = (value | rn << 16) >>> 0
    value = (value | (operand2 & 0xff)) >>> 0

    return value
  }

  value = (value | rn << 16) >>> 0
  value = (value | (operand2 & 0xf)) >>> 0

  return value
}