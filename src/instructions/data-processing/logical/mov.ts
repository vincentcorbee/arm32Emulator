import { MOV } from "../../../constants/codes"
import { dataProcessing, DataProcessingArgs } from "../data-processing"

export type MovArgs = Pick<DataProcessingArgs, 'cond' | 'rd' | 'i' | 'operand2' | 's'>

export const mov = (args: MovArgs) => dataProcessing({ ...args, opCode: MOV });