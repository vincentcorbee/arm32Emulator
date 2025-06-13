import { MVN } from '../../../constants/codes';
import { dataProcessing, DataProcessingArgs } from '../data-processing';

export type MvnArgs = Omit<DataProcessingArgs, 'opCode'>;

export const mvn = (args: MvnArgs) => dataProcessing({ ...args, opCode: MVN });
