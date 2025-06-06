import { MOV } from "../../../constants/codes"
import { dataProcessing, DataProcessingArgs } from "../data-processing"

export type MovArgs = Omit<DataProcessingArgs, 'opCode'>

export const mov = (args: MovArgs) => dataProcessing({ ...args, opCode: MOV });