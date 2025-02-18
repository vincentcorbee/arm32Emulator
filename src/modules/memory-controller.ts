import { Region, DeviceInterface, MemoryControllerInterface } from "./types"

export class MemoryController implements MemoryControllerInterface{
  #regions: Region[]

  constructor() {
    this.#regions = []
  }

  mapDevice(start: number, end: number, device: DeviceInterface, remap = false) {
    const region = { start, end, device, remap }

    this.#regions.unshift(region)
  }

  unmapDevice(device: DeviceInterface) {
    this.#regions = this.#regions.filter(region => region.device !== device)
  }

  readUint8(address: number): number {
    const { remap, device, start } = this.#findRegion(address)
    const mappedAddress = remap ? address - start : address

    return device.readUint8(mappedAddress)
  }

  writeUint8(address: number, value: number): void {
    const { remap, device, start } = this.#findRegion(address)
    const mappedAddress = remap ? address - start : address

    device.writeUint8(mappedAddress, value)
  }

  writeUint32(address: number, value: number) {
    const { remap, device, start } = this.#findRegion(address)
    const mappedAddress = remap ? address - start : address

    device.writeUint32(mappedAddress, value)
  }

  readUint32(address: number): number {
    const { remap, device, start } = this.#findRegion(address)
    const mappedAddress = remap ? address - start : address

    return device.readUint32(mappedAddress)
  }

  getBufferSlice(address: number, length: number): ArrayBuffer {
    const { device, remap, start } = this.#findRegion(address)
    const mappedAddress = remap ? address - start : address

    return device.getBufferSlice(mappedAddress, length)
  }

  #findRegion(address: number): Region {
    const region = this.#regions.find(region => address >= region.start && address <= region.end)

    if (!region) {
      throw new Error(`No device mapped at address ${address.toString(16)}`)
    }

    return region
  }
}