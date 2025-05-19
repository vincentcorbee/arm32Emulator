export interface CPUInterface {
  run(): void
  cycle(): void
  setPC(value: number): void
  setSP(value: number): void
  viewRegisters(): void
}

export type CPU = CPUInterface;