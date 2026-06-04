import { singleDataTransfer, SingleDataTransferArgs } from '../single-data-transfer';

export type StrArgs = Omit<SingleDataTransferArgs, 'l'>;

export const str = (args: StrArgs) => singleDataTransfer({ ...args, l: 0 });
