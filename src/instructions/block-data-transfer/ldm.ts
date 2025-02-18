import { blockDataTransfer, BlockDataTransferArgs } from "./block-data-transfer";

export type LdmArgs = Omit<BlockDataTransferArgs, 'l'>

export const ldm = (args: LdmArgs) => blockDataTransfer({ ...args, l: 1 });