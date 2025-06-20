import { Register } from '../../types/codes/register';

export interface CPUInterface {
  run(): void;
  cycle(): void;
  setPC(value: number): void;
  setSP(value: number): void;
  viewRegisters(): void;
  getRegister(register: Register): number;
}

export type CPU = CPUInterface;

export type Handler = (instruction: number) => void;

export type Handlers = Handler | ((instruction: number) => Handler);

export type InstructionHandlers = Record<number, Handlers>;

export type BlockDataTransferHandlers = Record<number, Handlers>;

export type SingleDataTransferHandlers = Record<number, Handlers>;

export type DataProcessingHandlers = Record<number, Handlers>;

export type ConditionHandler = () => boolean;

export type ConditionHandlers = Record<number, ConditionHandler>;

export type ShiftHandler = (value: number, shift: number) => ShiftResult;

export type ShiftHandlers = Record<number, ShiftHandler>;

export type ShiftResult = { carry: number; value: number };

export type SecondOperandValue = { carry: number; value: number };

export type Pipeline = { fetch: number | null; decode: number | null; execute: (() => void) | null };

export type Instruction = number;

export type RegistersMap = Map<number, number>;
