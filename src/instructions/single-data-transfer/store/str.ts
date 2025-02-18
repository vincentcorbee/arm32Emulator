import { singleDataTransfer, SingleDataTransferArgs } from "../single-data-transfer";

export type StrArgs = Omit<SingleDataTransferArgs, 'l'>

export const str = (args: StrArgs) => singleDataTransfer({ ...args, l: 0 })
  // const { prePost = 0, upDown = 1, byteWord = 0, writeBack = 0, rn, rd, imm12, rm } = args
  // const i = imm12 ? 1 : 0
  // const store = 0

  // let value = (AL << 28) >>> 0

  // value = (value | (STR << 26)) >>> 0
  // value = (value | (i << 25)) >>> 0
  // value = (value | (prePost << 24)) >>> 0
  // value = (value | (upDown << 23)) >>> 0
  // value = (value | (byteWord << 22)) >>> 0
  // value = (value | (writeBack << 21)) >>> 0
  // value = (value | (store << 20)) >>> 0
  // value = (value | rn << 16) >>> 0
  // value = (value | rd << 12) >>> 0

  // if (imm12 !== undefined) value = (value | (imm12 & 0xfff)) >>> 0

  // if (rm !== undefined) value = (value | (rm & 0xf)) >>> 0

  // return value
