import { AL, BRANCH_EXCHANGE } from '../../constants/codes';

export type BxArgs = {
  cond?: number;
  rn: number;
};

export const bx = (args: BxArgs) => {
  const { cond = AL, rn } = args;

  let value = (cond << 28) >>> 0;

  value = (value | (BRANCH_EXCHANGE << 4)) >>> 0;
  value = (value | (rn & 0xf)) >>> 0;

  return value;
};
