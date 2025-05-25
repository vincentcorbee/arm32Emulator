import { Memory } from "../memory";
import { CPUInterface} from "./types";
import { REGISTERS } from "./constants";
import { MemoryController } from "../memory-controller/types";

export class CPU implements CPUInterface {
  #registers: Map<number, number>
  #registerMemory: Memory;
  #memoryController: MemoryController;

  constructor(memoryController: MemoryController) {
    this.#registers = REGISTERS
    this.#registerMemory = new Memory(this.#registers.size * 4);
    this.#memoryController = memoryController;
  }

  setPC(value: number): void {}

  setSP(value: number): void {}

  viewRegisters(): void {}

  cycle(): void {}

  run(): void {}

  #getRegisterIndex(register: number): number {
    const registerIndex = this.#registers.get(register);

    if (registerIndex === undefined) throw Error(`Invalid register: ${register}`);

    return registerIndex;
  }

  #getRegister(register: number): number {
    const registerIndex = this.#getRegisterIndex(register);

    return this.#registerMemory.readUint32(registerIndex) as number;
  }

  #setRegister(register: number, value: number): void {
    const registerIndex = this.#getRegisterIndex(register);

    this.#registerMemory.writeUint32(registerIndex, value);
  }

  #fetch(): void {}

  #decode(): void {}

  #execute(): void {}
}