import { AL } from "../../constants/codes"

export type MultiplyArgs = {
  cond?: number
  a: number
  s?: number
  rn?: number,
  rs: number,
  rm: number,
  rd: number,
}

export const multiply = (args: MultiplyArgs): number => {
  const { cond = AL, a, s = 0, rn = 0, rs, rm, rd } = args

  let value = cond << 28

  value = (value | a << 21) >>> 0
  value = (value | s << 20) >>> 0
  value = (value | rd << 16) >>> 0
  value = (value | rn << 12) >>> 0
  value = (value | rs << 8) >>> 0
  value = (value | 0x9 << 4) >>> 0
  value = (value | rm) >>> 0

  return value
}