import { ADD } from '../../../constants/codes/op-codes';
import { dataProcessing, DataProcessingArgs } from '../data-processing';

export type AddArgs = Omit<DataProcessingArgs, 'opCode'>;

export const add = (args: AddArgs) => dataProcessing({ ...args, opCode: ADD });
