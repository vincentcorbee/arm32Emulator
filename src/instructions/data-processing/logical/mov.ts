import { MOV } from "../../../constants/codes"
import { dataProcessing, DataProcessingArgs } from "../data-processing"

export const mov = (args: Pick<DataProcessingArgs, 'cond' | 'rd' | 'i' | 'operand2' | 's'>) =>
  dataProcessing({ ...args, opCode: MOV });