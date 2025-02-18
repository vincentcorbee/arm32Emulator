import { SUB } from "../../../constants/codes/op-codes"
import { dataProcessing, DataProcessingArgs } from "../data-processing";

export const sub = (args: Omit<DataProcessingArgs, 'opCode'>) => dataProcessing({ ...args, opCode: SUB });