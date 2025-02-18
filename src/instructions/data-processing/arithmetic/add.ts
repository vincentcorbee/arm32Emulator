import { ADD } from "../../../constants/codes/op-codes"
import { dataProcessing, DataProcessingArgs } from "../data-processing";

export const add = (args: Omit<DataProcessingArgs, 'opCode'>) => dataProcessing({ ...args, opCode: ADD });