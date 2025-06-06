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

export type Pipeline = { fetch: number | null, decode: number | null, execute: (() => void) | null }

export type RegistersMap = Map<number, number>