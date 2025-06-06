import { RegisterNameToCode } from "../../constants/maps"
import { Register } from "../cpu/types"

export function getRegisterCode(node: any): any {
  const { value } = node

  const register = RegisterNameToCode[value as Register]

  if (register === undefined) throw Error(`Unknown register ${value}`)

  return register
}