import { ASR, LSL, LSR, ROR } from '../mnemonics';
import { LSL as LSL_CODE, LSR as LSR_CODE, ASR as ASR_CODE, ROR as ROR_CODE } from '../codes/shift-types';
import { ShiftType as ShiftTypeName } from '../../types/mnemonics/shift-type';
import { ShiftType as ShiftTypeCode } from '../../types/codes/shift-type';

export const ShiftTypeNameToCode: Record<ShiftTypeName, ShiftTypeCode> = {
  [LSL]: LSL_CODE,
  [LSR]: LSR_CODE,
  [ASR]: ASR_CODE,
  [ROR]: ROR_CODE,
};
