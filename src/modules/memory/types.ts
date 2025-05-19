export type DeviceInterface = {
  writeUint32: (address: number, value: number) => void
  readUint32: (address: number) => number
  readUint8: (address: number) => number
  writeUint8: (address: number, value: number) => void
  readChar: (address: number) => string
  getBufferSlice: (address: number, length: number) => ArrayBuffer
}

export interface MemoryInterface extends DeviceInterface{
  readUint16(offset: number): number
  writeUint16(offset: number, value: number): void
  writeInt32(offset: number, value: number): void
  view(): void
  viewAt(address: number, options?: { length: number }): void
}

export interface MemoryControllerInterface {
  mapDevice(start: number, end: number, device: DeviceInterface, remap?: boolean): void
  unmapDevice(device: DeviceInterface): void
  readUint8(address: number): number
  writeUint8(address: number, value: number): void
  readUint32(address: number): number
  writeUint32(address: number, value: number): void
  getBufferSlice(address: number, length: number): ArrayBuffer
}

export type Region = {
  start: number
  end: number
  device: DeviceInterface
  remap: boolean
}

export type Device = DeviceInterface;

export type Memory = MemoryInterface;

export type MemoryController = MemoryControllerInterface;