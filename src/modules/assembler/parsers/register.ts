import { RegisterNameToCode } from "../../../constants/maps";
import { FP, LR, PC, R0, R1, R10, R11, R12, R13, R14, R15, R2, R3, R4, R5, R6, R7, R8, R9, SP } from "../../../constants/mnemonics";
import { either, map } from "../../parser-combinators";
import { Register } from "../../cpu/types";
import { createNode } from "./mappers";
import { upperOrLower } from "./upper-or-lower";

export const register = map(either(
  upperOrLower(R10),
  upperOrLower(R11),
  upperOrLower(R12),
  upperOrLower(R13),
  upperOrLower(R14),
  upperOrLower(R15),
  upperOrLower(PC),
  upperOrLower(SP),
  upperOrLower(FP),
  upperOrLower(LR),
  upperOrLower(R0),
  upperOrLower(R1),
  upperOrLower(R2),
  upperOrLower(R3),
  upperOrLower(R4),
  upperOrLower(R5),
  upperOrLower(R6),
  upperOrLower(R7),
  upperOrLower(R8),
  upperOrLower(R9),
), value => createNode('Register')(RegisterNameToCode[value as Register]))