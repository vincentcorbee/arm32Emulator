import { AL, SHIFT_SOURCE_IMMEDIATE, SHIFT_SOURCE_REGISTER, SINGLE_DATA_TRANSFER } from '../../constants/codes';
import { Instruction } from '../../modules/cpu/types';
import { Shift } from '../../types/shift';

export type ImmidiateOffset = {
  type: 'ImmediateExpression';
  value: number;
};

export type RegisterOffset = {
  type: 'Register';
  value: number;
  shift?: Shift;
};

export type Offset = ImmidiateOffset | RegisterOffset;

export type SingleDataTransferArgs = {
  cond?: number;
  i: 0 | 1;
  p?: 0 | 1;
  u?: 0 | 1;
  b?: 0 | 1;
  w?: 0 | 1;
  l: 0 | 1;
  rn: number;
  rd: number;
  offset: Offset;
};

export const singleDataTransfer = (args: SingleDataTransferArgs): Instruction => {
  const { cond = AL, p = 0, u: u = 1, b = 0, w = 0, i, l, rn, rd, offset } = args;

  let instruction = (cond << 28) >>> 0;

  instruction = (instruction | (SINGLE_DATA_TRANSFER << 26)) >>> 0;
  instruction = (instruction | (i << 25)) >>> 0;
  instruction = (instruction | (p << 24)) >>> 0;
  instruction = (instruction | (u << 23)) >>> 0;
  instruction = (instruction | (b << 22)) >>> 0;
  instruction = (instruction | (w << 21)) >>> 0;
  instruction = (instruction | (l << 20)) >>> 0;
  instruction = (instruction | (rn << 16)) >>> 0;
  instruction = (instruction | (rd << 12)) >>> 0;

  const { type, value: offsetValue } = offset;

  if (type === 'ImmediateExpression') instruction = (instruction | (offsetValue & 0xfff)) >>> 0;
  else {
    const { shift } = offset;

    instruction = (instruction | (offsetValue & 0xf)) >>> 0;

    if (shift) {
      const { source, type } = shift;

      instruction = (instruction | (type << 5)) >>> 0;

      if (source === SHIFT_SOURCE_REGISTER) {
        const { register } = shift;

        instruction = (instruction | (SHIFT_SOURCE_REGISTER << 4)) >>> 0;
        instruction = (instruction | (register << 8)) >>> 0;
      } else {
        const { amount } = shift;

        instruction = (instruction | (SHIFT_SOURCE_IMMEDIATE << 4)) >>> 0;
        instruction = (instruction | (amount << 7)) >>> 0;
      }
    }
  }

  return instruction;
};
