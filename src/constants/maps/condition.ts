import { AL, EQ, GE, GT, LE, LT } from '../mnemonics';
import * as ConditionCodes from '../codes/condition';
import { Condition as ConditionName } from '../../types/mnemonics/conditions';
import { Condition as ConditionCode } from '../../types/codes/condition';

export const ConditionNameToCode: Partial<Record<ConditionName, ConditionCode>> = {
  [EQ]: ConditionCodes.EQ,
  [AL]: ConditionCodes.AL,
  [GE]: ConditionCodes.GE,
  [GT]: ConditionCodes.GT,
  [LE]: ConditionCodes.LE,
  [LT]: ConditionCodes.LT,
};
