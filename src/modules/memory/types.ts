export interface MemoryInterface{
  readUint16(offset: number): number
  writeUint16(offset: number, value: number): void
  writeInt32(offset: number, value: number): void
  view(): void
  viewAt(address: number, options?: { length: number }): void
}

export type Memory = MemoryInterface;