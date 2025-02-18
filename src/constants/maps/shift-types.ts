import { ASR, LSL, LSR, ROR } from "../mnemonics";
import { LSL as LSL_CODE, LSR as LSR_CODE, ASR as ASR_CODE, ROR as ROR_CODE } from "../codes/shift-types";
import { ShiftTypes } from "../../modules/types";

export const ShiftTypeNameToCode: Record<ShiftTypes, number> = {
  [LSL]: LSL_CODE,
  [LSR]: LSR_CODE,
  [ASR]: ASR_CODE,
  [ROR]: ROR_CODE,
}