import { DATA_PROCESSING } from '../../constants/codes';
import { AL } from '../../constants/codes/condition';
import { Instruction } from '../../modules/cpu/types';
import { Condition } from '../../types/codes/condition';
import { Shift } from '../../types/shift';

export type Operand2Type = 'Register' | 'ImmidiateExpression';

export type Operand2 = {
  value: number;
  type: Operand2Type;
  shift?: Shift;
  rotate?: number;
};

export type DataProcessingArgs = {
  cond?: Condition;
  i: number;
  opCode: number;
  s?: number;
  rn?: number;
  rd?: number;
  operand2: Operand2;
};

export const dataProcessing = (args: DataProcessingArgs): Instruction => {
  const { cond = AL, opCode, rn = 0, rd = 0, i, operand2, s = 0 } = args;

  let instruction = (cond << 28) >>> 0;

  instruction = (instruction | (DATA_PROCESSING << 26)) >>> 0;
  instruction = (instruction | (i << 25)) >>> 0;
  instruction = (instruction | (opCode << 21)) >>> 0;
  instruction = (instruction | (s << 20)) >>> 0;
  instruction = (instruction | (rn << 16)) >>> 0;
  instruction = (instruction | (rd << 12)) >>> 0;

  const { value: operand2Value, type, shift, rotate = 0 } = operand2;

  if (type === 'ImmidiateExpression') {
    instruction = (instruction | (rotate << 8)) >>> 0;
    instruction = (instruction | (operand2Value & 0xff)) >>> 0;
  } else {
    instruction = (instruction | (operand2Value & 0xf)) >>> 0;

    if (shift) {
      const { type, amount, register } = shift;

      instruction = (instruction | (type << 5)) >>> 0;

      if (register !== undefined) {
        instruction = (instruction | 1) >>> 0;
        instruction = (instruction | (register << 8)) >>> 0;
      } else {
        instruction = (instruction | (amount << 7)) >>> 0;
      }
    }
  }

  return instruction;
};
