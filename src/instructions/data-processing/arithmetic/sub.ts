import { SUB } from '../../../constants/codes/op-codes';
import { dataProcessing, DataProcessingArgs } from '../data-processing';

export type SubArgs = Omit<DataProcessingArgs, 'opCode'>;

export const sub = (args: SubArgs) => dataProcessing({ ...args, opCode: SUB });
