import * as REGISTERS from '../../constants/mnemonics/registers';

export type RegisterName = (typeof REGISTERS)[keyof typeof REGISTERS];

export type GeneralRegisterName = Exclude<
  RegisterName,
  'R13_SVC' | 'R14_SVC' | 'R13_UND' | 'R14_UND' | 'SPSR_SVC' | 'SPSR_UND' | 'CPSR' | 'SPSR'
>;

export type GeneralPurposeRegisterName = Exclude<GeneralRegisterName, 'R15' | 'PC'>;

export type StatusRegisterName = Extract<RegisterName, 'CPSR' | 'SPSR'>;
