import { AL, SUPERVISOR_CALL } from "../../constants/codes"

export type SvcArgs = { cond?: number, comment: number }

export const svc = (args: SvcArgs) => {
  const { cond = AL, comment } = args

  let value = (cond << 28) >>> 0

  value = (value | (SUPERVISOR_CALL << 24)) >>> 0
  value = (value | (comment & 0xffffff)) >>> 0

  return value
}