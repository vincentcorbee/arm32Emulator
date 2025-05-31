import { Memory } from "../memory";
import { CPUInterface, InstructionHandlers, Pipeline, RegistersMap } from "./types";
import { REGISTERS } from "./constants";
import { MemoryController } from "../memory-controller/types";
import { PC, SP } from "../../constants/codes/registers";

export class CPU implements CPUInterface {
  #registers: RegistersMap
  #registerMemory: Memory;
  #memoryController: MemoryController;
  #pipeline: Pipeline;
  #cylces: number;
  #instructionHandlers: InstructionHandlers;

  constructor(memoryController: MemoryController) {
    this.#registers = REGISTERS
    this.#registerMemory = new Memory(this.#registers.size * 4);
    this.#memoryController = memoryController;
    this.#pipeline = { fetch: null, decode: null, execute: null };
    this.#cylces = 0;

    this.#instructionHandlers = {}
  }

  setPC(value: number): void {
    this.#setRegister(PC, value);
  }

  setSP(value: number): void {
    this.#setRegister(SP, value);
  }

  viewRegisters(): void {}

  cycle(): void {
    this.#fetch();
    this.#decode();
    this.#execute();

    this.#cylces += 1;

    /* Fill pipeline */
    if (!this.#pipeline.execute) this.cycle()
  }

  run(): void {
    while(true) {
      this.cycle();
    }
  }

  #undefinedTrap = (instruction: number) => {
    process.stderr.write(`Undefined instruction: ${instruction.toString(2).padStart(32, '0')}\n`);
  }

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


  #getClassCode(instruction: number): number {
    return instruction >>> 25 & 0x7
  }

  #fetch(): void {
    const pc = this.#getRegister(PC);
    const currentInstruction = this.#pipeline.fetch;
    const instruction = this.#memoryController.readUint32(pc);

    this.#setRegister(PC, pc + 4);

    this.#pipeline.decode = currentInstruction;
    this.#pipeline.fetch = instruction;
  }


  #decode(): void {
    const instruction = this.#pipeline.decode;

    if (instruction === null) {
      this.#pipeline.execute = null;

      return;
    };

    const classCode = this.#getClassCode(instruction);
    const handler = this.#instructionHandlers[classCode] || this.#undefinedTrap;

    this.#pipeline.execute = () => {
      let result = handler(instruction);

      while (typeof result === 'function') {
        result = result(instruction);
      }
    };
  }

  #execute(): void {
    if (!this.#pipeline.execute) return;

    this.#pipeline.execute();
  }
}