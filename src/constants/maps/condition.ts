import { AL, EQ, GE, GT, LE, LT } from "../mnemonics";
import * as ConditionCodes from '../codes/condition'
import { Condition } from "../../modules/cpu/types";

export const ConditionNameToCode: Partial<Record<Condition, number>> = {
  [EQ]: ConditionCodes.EQ,
  [AL]: ConditionCodes.AL,
  [GE]: ConditionCodes.GE,
  [GT]: ConditionCodes.GT,
  [LE]: ConditionCodes.LE,
  [LT]: ConditionCodes.LT,
}