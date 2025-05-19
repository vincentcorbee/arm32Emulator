import { AL, DATA_PROCESSING } from "../../constants/codes"
import { Shift } from "../../modules/cpu/types";

export type Operand2 = {
  value: number,
  type: 'Register' | 'ImmidiateExpression',
  shift?: Shift
  rotate?: number
}

export type DataProcessingArgs = {
  cond?: number;
  i: number;
  opCode: number;
  s?: number;
  rn?: number;
  rd?: number;
  operand2: Operand2;
}

export const dataProcessing = (args: DataProcessingArgs) => {
  const { cond = AL, opCode, rn = 0, rd = 0, i, operand2, s = 0 } = args

  let value = (cond << 28) >>> 0

  value = (value | (DATA_PROCESSING << 26)) >>> 0
  value = (value | i << 25) >>> 0
  value = (value | (opCode << 21)) >>> 0
  value = (value | s << 20) >>> 0
  value = (value | rn << 16) >>> 0
  value = (value | rd << 12) >>> 0

  const { value: operand2Value, type, shift, rotate = 0 } = operand2

  if (type === 'ImmidiateExpression') {
    value = (value | rotate << 8) >>> 0
    value = (value | (operand2Value & 0xff)) >>> 0
  } else {
    value = (value | (operand2Value & 0xf)) >>> 0

    if (shift) {
      const { type, amount, register } = shift

      value = (value | type << 5) >>> 0

      if (register !== undefined) {
        value = (value | 1) >>> 0
        value = (value | register << 8) >>> 0
      } else {
        value = (value | amount << 7) >>> 0
      }
    }
  }

  return value
}