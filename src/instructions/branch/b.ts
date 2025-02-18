import { AL, BRANCH } from "../../constants/codes"

export type BArgs =  {
  cond?: number,
  l: 0,
  offset: 0,
}

export const b = (args: BArgs): number => {
  const { cond = AL, offset, l } = args

  let value = (cond << 28) >>> 0

  value = (value | (BRANCH << 25)) >>> 0
  value = (value | (l << 24)) >>> 0
  value = (value | (offset & 0xffffff)) >>> 0

  return value
}