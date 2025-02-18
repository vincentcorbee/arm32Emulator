import { blockDataTransfer, BlockDataTransferArgs } from "./block-data-transfer";

export type StmArgs = Omit<BlockDataTransferArgs, 'l'>

export const stm = (args: StmArgs) => blockDataTransfer({ ...args, l: 0 });