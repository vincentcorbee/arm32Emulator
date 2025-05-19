import { RegisterNameToCode } from "../../constants/maps"
import { Registers } from "../cpu/types"

export function getRegisterCode(node: any): any {
  const { value } = node

  const register = RegisterNameToCode[value as Registers]

  if (register === undefined) throw Error(`Unknown register ${value}`)

  return register
}