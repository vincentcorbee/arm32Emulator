import { AL, SINGLE_DATA_TRANSFER } from '../../constants/codes';
import { Shift } from '../../types/shift';

export type ImmidiateOffset = {
  type: 'ImmidiateExpression';
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

export const singleDataTransfer = (args: SingleDataTransferArgs) => {
  const { cond = AL, p = 0, u: u = 1, b = 0, w = 0, i, l, rn, rd, offset } = args;

  let value = (cond << 28) >>> 0;

  value = (value | (SINGLE_DATA_TRANSFER << 26)) >>> 0;
  value = (value | (i << 25)) >>> 0;
  value = (value | (p << 24)) >>> 0;
  value = (value | (u << 23)) >>> 0;
  value = (value | (b << 22)) >>> 0;
  value = (value | (w << 21)) >>> 0;
  value = (value | (l << 20)) >>> 0;
  value = (value | (rn << 16)) >>> 0;
  value = (value | (rd << 12)) >>> 0;

  const { type, value: offsetValue } = offset;

  if (type === 'ImmidiateExpression') value = (value | (offsetValue & 0xfff)) >>> 0;
  else {
    const { shift } = offset;

    value = (value | (offsetValue & 0xf)) >>> 0;

    if (shift) {
      const { type, amount, register } = shift;

      value = (value | (type << 5)) >>> 0;

      if (register !== undefined) {
        value = (value | 1) >>> 0;
        value = (value | (register << 8)) >>> 0;
      } else {
        value = (value | (amount << 7)) >>> 0;
      }
    }
  }

  return value;
};
