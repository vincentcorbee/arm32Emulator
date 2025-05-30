import { Registers } from "../../modules/cpu/types";
import { R0, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, FP, IP, SP, LR, PC, CPSR, R13_SVC, R14_SVC, SPSR_SVC, R11, R12, R13, R14, R15, SPSR, SPSR_UND, R14_UND, R13_UND } from "../codes/registers";

export const RegisterCodesToNames: Record<number, Registers> = {
  [R0]: 'R0',
  [R1]: 'R1',
  [R2]: 'R2',
  [R3]: 'R3',
  [R4]: 'R4',
  [R5]: 'R5',
  [R6]: 'R6',
  [R7]: 'R7',
  [R8]: 'R8',
  [R9]: 'R9',
  [R10]: 'R10',
  [FP]: 'FP',
  [IP]: 'IP',
  [SP]: 'SP',
  [LR]: 'LR',
  [PC]: 'PC',
  [CPSR]: 'CPSR',
  [R13_SVC]: 'R13_SVC',
  [R13_UND]: 'R13_UND',
  [R14_SVC]: 'R14_SVC',
  [R14_UND]: 'R14_UND',
  [SPSR_SVC]: 'SPSR_SVC',
  [SPSR_UND]: 'SPSR_UND',
  [SPSR]: 'SPSR',
}

export const RegisterNameToCode: Record<Registers, number> = {
  'R0': R0,
  'R1': R1,
  'R2': R2,
  'R3': R3,
  'R4': R4,
  'R5': R5,
  'R6': R6,
  'R7': R7,
  'R8': R8,
  'R9': R9,
  'R10': R10,
  'R11': R11,
  'FP': FP,
  'R12': R12,
  'IP': IP,
  'R13': R13,
  'SP': SP,
  'R14': R14,
  'LR': LR,
  'R15': R15,
  'PC': PC,
  'CPSR': CPSR,
  'R13_SVC': R13_SVC,
  'R13_UND': R13_UND,
  'R14_SVC': R14_SVC,
  'R14_UND': R14_UND,
  'SPSR_SVC': SPSR_SVC,
  'SPSR_UND': SPSR_UND,
  'SPSR': SPSR
};