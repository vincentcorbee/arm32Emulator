import { singleDataTransfer, SingleDataTransferArgs } from "../single-data-transfer";

export type LdrArgs = Omit<SingleDataTransferArgs, 'l'>

export const ldr = (args: LdrArgs) => singleDataTransfer({ ...args, l: 1 })
