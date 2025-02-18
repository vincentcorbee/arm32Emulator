import { AL, EQ, GE, GT, LE, LT } from "../mnemonics";
import * as ConditionCodes from '../codes/condition'
import { Conditions } from "../../modules/types";

export const ConditionNameToCode: Partial<Record<Conditions, number>> = {
  [EQ]: ConditionCodes.EQ,
  [AL]: ConditionCodes.AL,
  [GE]: ConditionCodes.GE,
  [GT]: ConditionCodes.GT,
  [LE]: ConditionCodes.LE,
  [LT]: ConditionCodes.LT,
}