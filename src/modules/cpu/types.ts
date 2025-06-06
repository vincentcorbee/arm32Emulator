import * as CONDITION_CODES from '../../constants/codes/condition'

export interface CPUInterface {
  run(): void
  cycle(): void
  setPC(value: number): void
  setSP(value: number): void
  viewRegisters(): void
}

export type CPU = CPUInterface;

export type Handler = (instruction: number) => void

export type Handlers = Handler | ((instruction: number) => Handler)

export type InstructionHandlers = Record<number, Handlers>

export type BlockDataTransferHandlers = Record<number, Handlers>

export type SingleDataTransferHandlers = Record<number, Handlers>

export type DataProcessingHandlers = Record<number, Handlers>

export type ConditionHandler = () => boolean

export type ConditionHandlers = Record<number, ConditionHandler>

export type ShiftHandler = (value: number, shift: number) => number

export type ShiftHandlers = Record<number, ShiftHandler>

export type Pipeline = { fetch: number | null, decode: number | null, execute: (() => void) | null }

export type Instruction = number

export type ConditionCode = (typeof CONDITION_CODES)[keyof typeof CONDITION_CODES]

export type RegisterShift = {
  type: number, register: number
}

export type ImmediateShift = {
  type: number, amount: number
}

export type Shift = RegisterShift & ImmediateShift

export type Register =
  | 'R0'
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'R5'
  | 'R6'
  | 'R7'
  | 'R8'
  | 'R9'
  | 'R10'
  | 'R11'
  | 'R12'
  | 'R13'
  | 'R14'
  | 'R15'
  | 'FP'
  | 'IP'
  | 'PC'
  | 'SP'
  | 'LR'
  | 'CPSR'
  | 'R13_SVC'
  | 'R13_UND'
  | 'R14_SVC'
  | 'R14_UND'
  | 'SPSR_SVC'
  | 'SPSR_UND'
  | 'SPSR'

export type RegistersMap = Map<number, number>

export type OpCode =
  | 'AND'
  | 'SUB'
  | 'RSB'
  | 'ADD'
  | 'ADC'
  | 'SBC'
  | 'RSC'
  | 'TST'
  | 'TEQ'
  | 'CMP'
  | 'CMN'
  | 'ORR'
  | 'MOV'
  | 'BIC'
  | 'MVN'
  | 'B'
  | 'BL'
  | 'BX'
  | 'SVC'
  | 'LDR'
  | 'LDRB'
  | 'STR'
  | 'STRB'
  | 'STM'
  | 'LDM'
  | 'PUSH'
  | 'POP'
  | 'MUL'

export type Condition =
  | 'EQ'
  | 'NE'
  | 'CS'
  | 'CC'
  | 'MI'
  | 'PL'
  | 'VS'
  | 'VC'
  | 'HI'
  | 'LS'
  | 'GE'
  | 'LT'
  | 'GT'
  | 'LE'
  | 'AL'

export type ShiftType = 'LSL' | 'LSR' | 'ASR' | 'ROR'