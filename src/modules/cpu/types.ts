export interface CPUInterface {
  run(): void
  cycle(): void
  setPC(value: number): void
  setSP(value: number): void
  viewRegisters(): void
}

export type CPU = CPUInterface;

export type Trap = (instruction: number) => void

export type Traps = Trap | ((instruction: number) => Trap)

export type Pipeline = { fetch: number | null, decode: number | null, execute: (() => void) | null }

export type Registers =
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

export type OpCodes =
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

export type Conditions =
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

export type ShiftTypes = 'LSL' | 'LSR' | 'ASR' | 'ROR'

export type RegisterShift = {
  type: number, register: number
}

export type ImmediateShift = {
  type: number, amount: number
}

export type Shift = RegisterShift & ImmediateShift