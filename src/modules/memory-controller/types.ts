export interface MemoryControllerInterface {
  mapDevice(start: number, end: number, device: DeviceInterface, remap?: boolean): void;
  unmapDevice(device: DeviceInterface): void;
  readUint8(address: number): number;
  writeUint8(address: number, value: number): void;
  readUint32(address: number): number;
  writeUint32(address: number, value: number): void;
  getBufferSlice(address: number, length: number): ArrayBuffer;
}

export type DeviceInterface = {
  writeUint32: (address: number, value: number) => void;
  readUint32: (address: number) => number;
  readUint8: (address: number) => number;
  writeUint8: (address: number, value: number) => void;
  getBufferSlice: (address: number, length: number) => ArrayBuffer;
};

export type Region = {
  start: number;
  end: number;
  device: DeviceInterface;
  remap: boolean;
};

export type Device = DeviceInterface;

export type MemoryController = MemoryControllerInterface;
