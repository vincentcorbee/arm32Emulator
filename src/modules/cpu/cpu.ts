import { Memory } from '../memory';
import { MemoryController } from '../memory-controller/types';
import {
  ConditionHandlers,
  CPUInterface,
  DataProcessingHandlers,
  Instruction,
  InstructionHandlers,
  Pipeline,
  RegistersMap,
  SecondOperandValue,
  ShiftHandlers,
  ShiftResult,
} from './types';
import { REGISTERS } from './constants';
import { CPSR, PC, R0, SP, SPSR, SPSR_SVC, SPSR_UND } from '../../constants/codes/registers';
import { DATA_PROCESSING_IMMEDIATE, DATA_PROCESSING_REGISTER } from '../../constants/codes/class-codes';
import { C, N, V, Z } from '../../constants/codes/flags';
import { N as N_FLAG, C as C_FLAG, Z as Z_FLAG, V as V_FLAG } from '../../constants/mnemonics/flags';
import { AL, EQ, GE, GT, LE, LT, NE } from '../../constants/codes/condition';
import { M, SUPERVISOR, UND, USER } from '../../constants/codes/modes';
import { MOV } from '../../constants/codes/op-codes';
import { ASR, LSL, LSR, ROR, RRX } from '../../constants/codes/shift-types';
import { SHIFT_SOURCE_REGISTER } from '../../constants/codes/shift-source';
import { Register } from '../../types/codes/register';
import { RegisterCodesToNames } from '../../constants/maps';
import { Condition } from '../../types/codes/condition';
import { formatHex } from '../../utils';

export class CPU implements CPUInterface {
  #registers: RegistersMap;
  #registerMemory: Memory;
  #memoryController: MemoryController;
  #pipeline: Pipeline;
  #cylces: number;
  #instructionHandlers: InstructionHandlers;
  #dataProcessingHandlers: DataProcessingHandlers;
  #conditionHandlers: ConditionHandlers;
  #shiftHandlers: ShiftHandlers;

  constructor(memoryController: MemoryController) {
    this.#registers = REGISTERS;
    this.#registerMemory = new Memory(this.#registers.size * 4);
    this.#memoryController = memoryController;
    this.#pipeline = { fetch: null, decode: null, execute: null };
    this.#cylces = 0;

    this.#instructionHandlers = {
      [DATA_PROCESSING_REGISTER]: this.#dataProcessingHandler,
      [DATA_PROCESSING_IMMEDIATE]: this.#dataProcessingHandler,
    };

    this.#dataProcessingHandlers = {
      [MOV]: this.#MOVHandler,
    };

    this.#conditionHandlers = {
      [AL]: this.#al,
      [EQ]: this.#eq,
      [NE]: this.#ne,
      [GE]: this.#ge,
      [GT]: this.#gt,
      [LE]: this.#le,
      [LT]: this.#lt,
    };

    this.#shiftHandlers = {
      [LSL]: this.#lsl,
      [LSR]: this.#lsr,
      [ASR]: this.#asr,
      [ROR]: this.#ror,
      [RRX]: this.#rrx,
    };

    /* Start in user mode */
    this.#setMode(USER);
  }

  setPC(value: number): void {
    this.#setRegister(PC, value);
  }

  setSP(value: number): void {
    this.#setRegister(SP, value);
  }

  getRegister(register: Register): number {
    if (register >= R0 && register <= CPSR) return this.#getRegister(register);

    throw Error(`Invalid register: ${RegisterCodesToNames[register]}`);
  }

  viewRegisters(): void {
    this.#registers.keys().forEach((register) => {
      const name = RegisterCodesToNames[register as Register];

      /* Omit banked registers */
      if (!name.includes('_')) {
        const value = this.#getRegister(register);

        let line = `${name}:${' '.repeat(5 - name.length)}${formatHex(value)} `;

        if (register === CPSR) {
          line += this.#getContentsPSR(register);
        } else if (register !== PC) {
          for (let shift = 24; shift >= 0; shift -= 8) {
            const charCode = (value >>> shift) & 0xff;

            if (charCode >= 0x20 && charCode <= 0x7e) {
              line += String.fromCharCode(charCode);
            } else {
              line += '·';
            }
          }
        }

        process.stdout.write(`${line}\n`);
      }

      if (register === PC) process.stdout.write('\n');
    });

    const name = RegisterCodesToNames[SPSR];
    const register = this.#getSPSR();
    const value = register === SPSR ? 0 : this.#getRegister(register);
    const contents = register === SPSR ? '....' : this.#getContentsPSR(register);
    const line = `${name}:${' '.repeat(5 - name.length)}${formatHex(value)} ${contents}`;

    process.stdout.write(`${line}\n\n`);
  }

  cycle(): void {
    this.#fetch();
    this.#decode();
    this.#execute();

    this.#cylces += 1;

    /* Fill pipeline */
    if (!this.#pipeline.execute) this.cycle();
  }

  /**
   * The CPU runs forever until the program is terminated.
   */
  run(): void {
    while (true) {
      this.cycle();
    }
  }

  /**
   * 4x   2x x 4x     x 4x 4x 12x
   * Cond 00 I Opcode S Rn Rd Op2
   */
  #dataProcessingHandler = (instruction: Instruction) => {
    return this.#dataProcessingHandlers[(instruction >> 21) & 0xf];
  };

  /**
   * MOV{cond}{S} Rd, <Op2>
   *
   * 4x   2x x 4x     x 4x 4x 12x
   * Cond 00 I Opcode S Rn Rd Op2
   */
  #MOVHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const rd = (instruction >> 12) & 0xf;
    const s = (instruction >> 20) & 0x1;
    const { carry, value } = this.#getSecondOperandValue(instruction);

    this.#setRegister(rd, value);

    if (s) {
      this.#setCarryFlag(carry === 1);
      this.#setNegativeFlag(((value >>> 31) & 0x1) === 1);
      this.#setZeroFlag(value === 0);
    }
  };

  /**
   * 3.4.5 Undefined instruction trap
   */
  #undefinedTrap = (instruction: Instruction) => {
    process.stderr.write(`Undefined instruction: ${instruction.toString(2).padStart(32, '0')}\n`);
  };

  /**
   * Register
   * 11             4 3    0
   *      Shift        RM
   *
   * Immediate value
   * 11     8 7            0
   *  Rotate        IMM
   */
  #getSecondOperandValue(instruction: Instruction): SecondOperandValue {
    const immediate = (instruction >> 25) & 0x1;

    if (immediate) {
      const imm = instruction & 0xff;
      const rotate = ((instruction >> 8) & 0xf) << 1;
      const { value, carry } = this.#ror(imm, rotate * 2);

      return { carry, value };
    }

    const registerValue = this.#getRegister(instruction & 0xf);
    const shift = (instruction >> 4) & 0xff;

    if (shift) {
      const shiftType = (instruction >> 5) & 0x3;
      const shiftSource = (instruction >> 4) & 0x1;
      const shiftAmount =
        shiftSource === SHIFT_SOURCE_REGISTER ? this.#getRegister((instruction >> 8) & 0xf) : (instruction >> 7) & 0x1f;

      return this.#shift(registerValue, shiftAmount, shiftType);
    }

    const carry = this.#getCarryFlag();

    return { carry, value: registerValue };
  }

  #shift(value: number, shift: number, shiftType: number): ShiftResult {
    const type = shiftType === ROR && shift !== 0 ? ROR : shiftType;
    const handler = this.#shiftHandlers[type];

    if (typeof handler !== 'function') {
      const carry = this.#getCarryFlag();

      return { carry, value };
    }

    return handler(value, shift);
  }

  #ror = (value: number, shift: number): ShiftResult => {
    const result = (value >>> shift) | ((value << (32 - shift)) >>> 0);
    const carry = (value >>> (shift - 1)) & 0x1;

    return { carry, value: result };
  };

  #rrx = (value: number): ShiftResult => {
    const currentCarry = this.#getCarryFlag();
    const result = ((value >>> 1) | (currentCarry << 31)) >>> 0;
    const carry = value & 0x1;

    return { carry, value: result };
  };

  #lsl = (value: number, shift: number): ShiftResult => {
    if (shift === 0) {
      const carry = this.#getCarryFlag();

      return { carry, value };
    }

    const result = (value << shift) >>> 0;
    const carry = (value >>> (32 - shift)) & 0x1;

    return { carry, value: result };
  };

  #lsr = (value: number, shift: number): ShiftResult => {
    if (shift === 0) {
      const carry = value >>> 31;

      return { carry, value: 0 };
    }

    const result = value >>> shift;
    const carry = (value >>> (shift - 1)) & 0x1;

    return { carry, value: result };
  };

  #asr = (value: number, shift: number): ShiftResult => {
    if (shift === 0) {
      const carry = value >>> 31;
      const result = carry ? 0xffffffff : 0;

      return { carry, value: result };
    }

    const result = (value >> shift) >>> 0;
    const carry = (value >>> (shift - 1)) & 0x1;

    return { carry, value: result };
  };

  #shouldExecute(instruction: Instruction): boolean {
    const condition = this.#getConditionCode(instruction);
    const conditionHandler = this.#getConditionHandler(condition);

    if (typeof conditionHandler === 'function') return conditionHandler();

    return false;
  }

  #getConditionCode(instruction: Instruction): Condition {
    const code = (instruction >> 28) & 0xf;

    if (code >= EQ && code <= AL) return code as Condition;

    return AL;
  }

  #getConditionHandler(condition: Condition) {
    return this.#conditionHandlers[condition];
  }

  #al = () => true;
  #eq = () => this.#getZeroFlag() === 1;
  #ne = () => this.#getZeroFlag() === 0;
  #ge = () => this.#getNegativeFlag() === this.#getOverflowFlag();
  #gt = () => this.#getZeroFlag() === 0 && this.#getNegativeFlag() === this.#getOverflowFlag();
  #le = () => this.#getZeroFlag() === 1 || this.#getNegativeFlag() !== this.#getOverflowFlag();
  #lt = () => this.#getNegativeFlag() !== this.#getOverflowFlag();

  #setMode(mode: number): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~M) | mode);
  }

  #getMode(): number {
    return this.#getRegister(CPSR) & M;
  }

  #getSPSR(): number {
    const mode = this.#getMode();

    switch (mode) {
      case SUPERVISOR: {
        return SPSR_SVC;
      }
      case UND: {
        return SPSR_UND;
      }
      default: {
        return SPSR;
      }
    }
  }

  #setZeroFlag(state: boolean): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~Z) | (state ? Z : 0));
  }

  #setNegativeFlag(state: boolean): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~N) | (state ? N : 0));
  }

  #setCarryFlag(state: boolean): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~C) | (state ? C : 0));
  }

  #setOverflowFlag(state: boolean): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~V) | (state ? V : 0));
  }

  #getZeroFlag(register = CPSR): number {
    return (this.#getRegister(register) & Z) >>> 0 ? 1 : 0;
  }

  #getNegativeFlag(register = CPSR): number {
    return (this.#getRegister(register) & N) >>> 0 ? 1 : 0;
  }

  #getCarryFlag(register = CPSR): number {
    return (this.#getRegister(register) & C) >>> 0 ? 1 : 0;
  }

  #getOverflowFlag(register = CPSR): number {
    return (this.#getRegister(register) & V) >>> 0 ? 1 : 0;
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

  #getContentsPSR(register: number): string {
    let contents = '';

    contents += this.#getNegativeFlag(register) ? N_FLAG : '.';
    contents += this.#getZeroFlag(register) ? Z_FLAG : '.';
    contents += this.#getCarryFlag(register) ? C_FLAG : '.';
    contents += this.#getOverflowFlag(register) ? V_FLAG : '.';

    return contents;
  }

  #getClassCode(instruction: number): number {
    return (instruction >>> 25) & 0x7;
  }

  /**
   * We fetch the next instruction from memory and increment the program counter by 4 bytes.
   */
  #fetch(): void {
    const pc = this.#getRegister(PC);
    const currentInstruction = this.#pipeline.fetch;
    const instruction = this.#memoryController.readUint32(pc);

    this.#setRegister(PC, pc + 4);

    this.#pipeline.decode = currentInstruction;
    this.#pipeline.fetch = instruction;
  }

  /**
   * Decodes the instruction and determine the type of instruction.
   *
   * We then set the execute function to the trap function that handles the instruction.
   *
   * Note:
   * This is a simple form of instruction decoding where we use the class bits to determine the type of instruction to handle.
   * This however could lead to ambigious situations. So a full proof decoding mechanism should be implemented later. But for now this is fine.
   */
  #decode(): void {
    const instruction = this.#pipeline.decode;

    if (instruction === null) {
      this.#pipeline.execute = null;

      return;
    }

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
