import { AL, SUPERVISOR_CALL, SVC } from "../../constants/codes"


export const svc = (args: { cond?: number, comment: number }) => {
  const { cond = AL, comment } = args

  let value = (cond << 28) >>> 0

  value = (value | (SUPERVISOR_CALL << 24)) >>> 0
  value = (value | (comment & 0xffffff)) >>> 0

  return value
}