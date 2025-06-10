import { AL, BLOCK_DATA_TRANSFER } from '../../constants/codes';

export type BlockDataTransferArgs = {
  cond?: number;
  p?: number;
  u?: number;
  s?: number;
  w?: number;
  l: number;
  rn: number;
  registerList: Array<number>;
};
/**
  31   28  27   25 24 23 22 21 20 19  16  15          0
    Cond     100    P  U  S  W  L   Rn    Register list
 */
export const blockDataTransfer = (args: BlockDataTransferArgs): number => {
  const { cond = AL, p = 0, u = 1, s = 0, w = 0, l, rn, registerList } = args;

  let value = (cond << 28) >>> 0;

  value = (value | (BLOCK_DATA_TRANSFER << 25)) >>> 0;
  value = (value | (p << 24)) >>> 0;
  value = (value | (u << 23)) >>> 0;
  value = (value | (s << 22)) >>> 0;
  value = (value | (w << 21)) >>> 0;
  value = (value | (l << 20)) >>> 0;
  value = (value | (rn << 16)) >>> 0;

  registerList.forEach((register) => {
    value = (value | (1 << register)) >>> 0;
  });

  return value;
};
