import { CPSR, PC, R0, R1, R10, R11, R12, R13, R13_SVC, R13_UND, R14, R14_SVC, R14_UND, R2, R3, R4, R5, R6, R7, R8, R9, SPSR_SVC, SPSR_UND } from "../../constants/codes/registers";
import { RegistersMap } from "./types";

export const REGISTERS: RegistersMap = new Map([
  [R0, R0],
  [R1, R1 << 2],
  [R2, R2 << 2],
  [R3, R3 << 2],
  [R4, R4 << 2],
  [R5, R5 << 2],
  [R6, R6 << 2],
  [R7, R7 << 2],
  [R8, R8 << 2],
  [R9, R9 << 2],
  [R10, R10 << 2],
  [R11, R11 << 2],
  [R12, R12 << 2],
  [R13, R13 << 2],
  [R14, R14 << 2],
  [PC, PC << 2],
  [CPSR, CPSR << 2],
  [R13_SVC, R13_SVC << 2],
  [R13_UND, R13_UND << 2],
  [R14_SVC, R14_SVC << 2],
  [R14_UND, R14_UND << 2],
  [SPSR_SVC, SPSR_SVC << 2],
  [SPSR_UND, SPSR_UND << 2]
])