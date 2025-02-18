import { Memory } from "./memory";
import { ADD, AL, BLOCK_DATA_TRANSFER, BRANCH, BRANCH_EXCHANGE, C, CMP, DATA_PROCESSING_IMMEDIATE, DATA_PROCESSING_REGISTER, EQ, GE, GT, LE, LR, LT, MOV, MULTIPLY, N, NE, R13_SVC, R13_UND, R14_SVC, R14_UND, SINGLE_DATA_TRANSFER_IMMIDIATE, SINGLE_DATA_TRANSFER_REGISTER, SPSR, SPSR_UND, SUB, SUPERVISOR, SUPERVISOR_CALL, UND, UNDEFINED, USER, V, Z } from "../constants/codes";
import { CPSR, PC, R0, R1, R10, R11, R12, R13, R14, R2, R3, R4, R5, R6, R7, R8, R9, SP, SPSR_SVC } from "../constants/codes";
import { EXIT_SYS_CALL, WRITE_SYS_CALL } from "../constants/codes/sys-calls";
import { CPUInterface } from "./types";
import { RegisterCodesToNames } from "../constants/maps";
import { MemoryController } from "./memory-controller";

type Trap = (instruction: number) => void

type Traps = Trap | ((instruction: number) => Trap)

const REGISTERS = new Map([
  [R0, R0],
  [R1, R1 << 2],
  [R2, R2 << 2],
  [R3, R3 << 2],
  [R4, R4 << 2],
  [R5, R5 << 2],
  [R6, R6 << 2],
  [R7, R7 << 2],
  [R8, R8 << 2],
  [R9, R9 << 2],
  [R10, R10 << 2],
  [R11, R11 << 2],
  [R12, R12 << 2],
  [R13, R13 << 2],
  [R14, R14 << 2],
  [PC, PC << 2],
  [CPSR, CPSR << 2],
  [R13_SVC, R13_SVC << 2],
  [R13_UND, R13_UND << 2],
  [R14_SVC, R14_SVC << 2],
  [R14_UND, R14_UND << 2],
  [SPSR_SVC, SPSR_SVC << 2],
  [SPSR_UND, SPSR_UND << 2]
])

/**
  All ARM instructions are 32 bits long.
  Instructions are stored word-aligned.

  https://developer.arm.com/documentation/dui0473/m/overview-of-the-arm-architecture/arm-and-thumb-instruction-set-overview

  Bits 27–25	Instruction Type	Examples
  000	Data Processing/Multiply	ADD, SUB, MOV, AND, CMP, MUL
  001	Data Processing Immediate	ADD, SUB with immediate value
  010	Load/Store Single Data	LDR, STR
  011	Undefined	Reserved
  100	Load/Store Multiple	LDM, STM
  101	Branch	B, BL
  110	Coprocessor	MRC, CDP
  111	SVC or Exception (Bit 24 = 1)	SVC
*/
export class CPU implements CPUInterface {
  #memoryController: MemoryController;
  #registers: Map<number, number>
  #registerMemory: Memory;
  #dataProcessingTraps: Record<number, Trap>;
  #singleDataTransferTraps: Record<number, Trap>;
  #blockDataTransferTraps: Record<number, Trap>;
  #instructionTraps: Record<number, Traps>;
  #conditions: Record<number, () => boolean>;

  #pipeline: { fetch: number | null, decode: number | null, execute: (() => void) | null };
  #cylces: number;

  constructor(memoryController: MemoryController) {
    this.#memoryController = memoryController;

    this.#dataProcessingTraps = {
      [MOV]: this.#MOVTrap,
      [ADD]: this.#ADDTrap,
      [SUB]: this.#SUBTrap,
      [CMP]: this.#CMPTrap,
    }

    this.#singleDataTransferTraps = {
      [1]: this.#LDRTrap,
      [0]: this.#STRTrap,
    }

    this.#blockDataTransferTraps = {
      [1]: this.#LDMTrap,
      [0]: this.#STMTrap,
    }

    this.#instructionTraps = {
      [DATA_PROCESSING_REGISTER]: this.#dataProcessingTrap,
      [DATA_PROCESSING_IMMEDIATE]: this.#dataProcessingTrap,
      [SUPERVISOR_CALL]: this.#SVCTrap,
      [SINGLE_DATA_TRANSFER_REGISTER]: this.#singleDataTransferTrap,
      [SINGLE_DATA_TRANSFER_IMMIDIATE]: this.#singleDataTransferTrap,
      [BRANCH]: this.#BTrap,
      [BLOCK_DATA_TRANSFER]: this.#blockDataTransferTrap,
      [MULTIPLY]: this.#MULTrap,
      [UNDEFINED]: this.#undefinedTrap,
      [BRANCH_EXCHANGE]: this.#BXTrap,
    }

    this.#registers = REGISTERS

    this.#conditions = {
      [AL]: () => true,
      [EQ]: () => this.#getZeroFlag() === 1,
      [NE]: () => this.#getZeroFlag() === 0,
      [GE]: () => this.#getNegativeFlag() === this.#getOverflowFlag(),
      [GT]: () => this.#getZeroFlag() === 0 && (this.#getNegativeFlag() ===  this.#getOverflowFlag()),
      [LE]: () => this.#getZeroFlag() === 1 || (this.#getNegativeFlag() !== this.#getOverflowFlag()),
      [LT]: () => this.#getNegativeFlag() !== this.#getOverflowFlag(),
    }

    const registerMemorySize = this.#registers.size * 4;

    this.#cylces = 0;
    this.#pipeline = { fetch: null, decode: null, execute: null };
    this.#registerMemory = new Memory(registerMemorySize);

    /* Start the program in user mode */
    this.#setMode(USER);
  }

  setPC(value: number): void {
    this.#setRegister(PC, value);
  }

  setSP(value: number): void {
    this.#setRegister(SP, value);
  }

  viewRegisters(): void {
    this.#registers.keys().forEach((register) => {
      const name = RegisterCodesToNames[register]

      /* Omit banked registers */
      if (!name.includes('_')) {
        const value = this.#getRegister(register);

        let line = `${name}:${' '.repeat(5 - name.length)}0x${value.toString(16).padStart(8, '0')} `;

        if (register === CPSR) {
          line += this.#getContentsPSR(register);

        } else if (register !== PC) {
          for (let shift = 24; shift >= 0; shift -= 8) {
            const charCode = (value >>> shift) & 0xff;

            if (charCode >= 0x20 && charCode <= 0x7e) {
              line += String.fromCharCode(charCode)
            } else {
              line += '·'
            }
          }
        }

        process.stdout.write(`${line}\n`);
      }

      if (register === PC) process.stdout.write('\n');

    });

    const name = RegisterCodesToNames[SPSR]
    const value = this.#getSPSR()
    const line = `${name}:${' '.repeat(5 - name.length)}0x${value.toString(16).padStart(8, '0')} ${this.#getContentsPSR(value)}`

    process.stdout.write(`${line}\n\n`);
  }

  /**
    ARM processors (in ARM state), the CPU uses a three-stage pipeline.
    It fetches, decodes, and executes instructions in parallel.
    This means that at any given moment, the CPU is working on three instructions simultaneously:

    1. Fetch: The CPU fetches the next instruction from memory.
    2. Decode: The CPU decodes the previously fetched instruction.
    3. Execute: The CPU executes the instruction decoded earlier.

    We fake this pipeline by using a simple object to store the current instruction in each stage.
  */
  cycle(): void {
    this.#fetch();
    this.#decode();
    this.#execute();

    this.#cylces += 1;

    /* Fill pipeline */
    if (!this.#pipeline.execute) this.cycle()
  }

  /**
   * The CPU runs forever until the program is terminated.
   */
  run(): void {
    while(true) {
      this.cycle();
    }
  }

  /**
    4x   2x x 4x     x 4x 4x 12x
    Cond 00 I Opcode S Rn Rd Op2
  */
  #dataProcessingTrap = (instruction: number) => {
    /*
      Immediate Operand

      0 = operand 2 is a register
      8x    4x
      Shift Rm

      1 = operand 2 is an immediate value
      4x     8x
      Rotate mm
    */
    const opCode = instruction >> 21 & 0xf;

    return this.#dataProcessingTraps[opCode];
  }

  /**
    4x   x x x x x x x x 4x 4x 12x
    Cond 0 1 I P U B W L Rn Rd Offset
  */
  #singleDataTransferTrap = (instruction: number) => {
    const loadStore = instruction >> 20 & 0x1;

    return this.#singleDataTransferTraps[loadStore];
  }

   /**
   *
   * Addressing modes - Stack modes
   *
   * Full ascending stack
   * Pre-increment addressing
   *
   * Empty ascending stack
   * Post-increment addressing
   *
   * Full descending stack
   * Pre-decrement addressing
   *
   * Empty descending stack
   * Post-decrement addressing
   */
   #blockDataTransferTrap = (instruction: number) => {
    const loadStore = instruction >> 20 & 0x1;

    return this.#blockDataTransferTraps[loadStore];
  }

  /**
   * B{L}{cond} <expression>
   *
   * 4x   x x x x 24x
   * Cond 1 0 1 L offset
   */
  #BTrap = (instruction: number): void => {
    const cond = instruction >> 28 & 0xf;
    const offset = (instruction & 0xffffff);
    const sign = offset >>> 23 & 0x1;
    const pc = this.#getRegister(PC);
    const l = instruction >> 24 & 0x1;
    const signedOffset = sign ? (((0xff << 24) >>> 0) | offset) : offset;
    const shouldExecute = this.#shouldExecute(cond);

    if (shouldExecute) {
      this.#setRegister(PC, pc + signedOffset);

      /* Adjust PC to allow prefetching */
      if (l) this.#setRegister(LR, pc - 4);

      this.#flushPipeline();
    }
  }

  #BXTrap = (instruction: number): void => {
    const rn = instruction & 0xf;

    this.#setRegister(PC, this.#getRegister(rn));

    this.#flushPipeline()
  }

  /**
   * CMP{cond} {Rn}, Operand2
   */
  #CMPTrap = (instruction: number): void => {
    const immediate = instruction >> 25 & 0x1;
    const rn = instruction >> 16 & 0xf;

    const left = this.#getRegister(rn);
    const right = immediate ? instruction & 0xfff : this.#getRegister(instruction & 0xff);

    const result = left - right;

    this.#setCarryFlag(result > 0);
    this.#setNegativeFlag(result < 0);
    this.#setZeroFlag(result === 0);
  }

  /**
    MOV{S}{cond} {Rd}, Operand2

    4x   2x x 4x     x 4x 4x 12x
    Cond 00 I Opcode S Rn Rd Op2
  */
  #MOVTrap = (instruction: number): void => {
    const immediate = instruction >> 25 & 0x1;
    const rd = instruction >> 12 & 0xf;

    if (immediate) {
      const immediateValue = instruction & 0xff;

      this.#setRegister(rd, immediateValue);
    } else {
      const rm = instruction & 0xff;

      this.#setRegister(rd, this.#getRegister(rm));
    }
  }

  /**
   * ADD{S}{cond} Rd, Rn, Operand2
   * ADD{cond} Rd, Rn, #imm12
   *
   * 4x   2x x 4x     x 4x 4x 12x
   * Cond 00 I Opcode S Rn Rd Op2
   */
  #ADDTrap = (instruction: number): void => {
    const immediate = instruction >> 25 & 0x1;
    const rn = instruction >> 16 & 0xf;
    const rd = instruction >> 12 & 0xf;

    const left = this.#getRegister(rn);
    const right = immediate ? instruction & 0xfff : this.#getRegister(instruction & 0xff);

    this.#setRegister(rd, left + right);
  }

  /**
   * 31  28 27             22 21 20 19 16 15 12 11 8 7     4 3  0
   *  Cond  0  0  0  0  0  0  A  S   Rd    Rn    Rs  1 0 0 1  Rm
   */
  #MULTrap = (instruction: number): void => {
    const a = instruction >> 21 & 0x1;

    if (a === 1) throw Error('Invalid instruction');

    const cond = instruction >> 28 & 0xf;
    const shouldExecute = this.#shouldExecute(cond);

    if (!shouldExecute) return;

    const s = instruction >> 20 & 0x1;
    const rd = instruction >> 16 & 0xf;
    const rs = instruction >> 8 & 0xf;
    const rm = instruction & 0xf;
    const left = this.#getRegister(rm);
    const right = this.#getRegister(rs);
    const result = left * right;

    this.#setRegister(rd, result);
  }

  /**
   * SUB{S}{cond} Rd, Rn, Operand2
   * SUB{cond} Rd, Rn, #imm12
   *
   * 4x   2x x 4x     x 4x 4x 12x
   * Cond 00 I Opcode S Rn Rd Op2
   */
  #SUBTrap = (instruction: number): void => {
    const immediate = instruction >> 25 & 0x1;
    const rn = instruction >> 16 & 0xf;
    const rd = instruction >> 12 & 0xf;

    const left = this.#getRegister(rn);
    const right = immediate ? instruction & 0xfff : this.#getRegister(instruction & 0xff);

    this.#setRegister(rd, left - right);
  }

  /**
   * LDR{cond}{B}{T} Rd, [Rn, #Offset]
   *
   * 4x   x x x x x x x x 4x 4x 12x
   * Cond 0 1 I P U B W L Rn Rd Offset
   */
  #LDRTrap = (instruction: number): void => {
    const immediate = instruction >> 25 & 0x1;
    const loadStore = instruction >> 20 & 0x1;

    if (loadStore === 0) throw Error('Invalid instruction');

    const writeBack = instruction >> 21 & 0x1;
    const byteWord = instruction >> 22 & 0x1;
    const upDown = instruction >> 23 & 0x1;
    const prePost = instruction >> 24 & 0x1;
    const baseRegister = instruction >> 16 & 0xf;
    const destinationRegister = instruction >> 12 & 0xf;
    const offset = instruction & 0xfff;
    const offsetValue = (immediate ? offset : this.#getRegister(offset & 0xf)) * (upDown ? 1 : -1);
    const addressBase = this.#getRegister(baseRegister)
    const address = prePost || (!prePost && !writeBack) ? addressBase + offsetValue : addressBase;

    this.#setRegister(destinationRegister, byteWord ? this.#memoryController.readUint8(address) : this.#memoryController.readUint32(address));

    if (writeBack) {
      this.#setRegister(baseRegister, prePost ? address : address + offsetValue);
    }
  }

  /**
   * STR{cond}{B}{T} Rd, <Address>
   *
   * 4x   x x x x x x x x 4x 4x 12x
   * Cond 0 1 I P U B W L Rn Rd Offset
   */
  #STRTrap = (instruction: number): void => {
    const immediate = instruction >> 25 & 0x1;
    const loadStore = instruction >> 20 & 0x1;

    if (loadStore === 1) throw Error('Invalid instruction');

    const writeBack = instruction >> 21 & 0x1;
    const byteWord = instruction >> 22 & 0x1;
    const upDown = instruction >> 23 & 0x1;
    const prePost = instruction >> 24 & 0x1;
    const baseRegister = instruction >> 16 & 0xf;
    const sourceRegister = instruction >> 12 & 0xf;
    const offset = instruction & 0xfff;
    const offsetValue = (immediate ? offset : this.#getRegister(offset & 0xf)) * (upDown ? 1 : -1);
    const addressBase = this.#getRegister(baseRegister)
    const address = prePost ? addressBase + offsetValue : addressBase;
    const value = this.#getRegister(sourceRegister)

    if (byteWord) {
      this.#memoryController.writeUint8(address, value);
    } else {
      this.#memoryController.writeUint32(address, value);
    }

    if (writeBack) {
      this.#setRegister(baseRegister, prePost ? address : address + offsetValue);
    }
  }

  /**
   * STM{cond}<FD|ED|FA|EA|IA|IB|DA|DB> Rn{!},<Rlist>{^}
   *
   * 31   28  27   25 24 23 22 21 20 19  16  15          0
   *   Cond     100    P  U  S  W  L   Rn    Register list
   *
   */
  #STMTrap = (instruction: number): void => {
    const loadStore = instruction >> 20 & 0x1;

    if (loadStore === 1) throw Error('Invalid instruction');

    const _cond = instruction >> 28 & 0xf;
    const prePost = instruction >> 24 & 0x1;
    const upDown = instruction >> 23 & 0x1;
    const _psrAndForceUserBit = instruction >> 22 & 0x1;
    const writeBack = instruction >> 21 & 0x1;
    const baseRegister = instruction >> 16 & 0xf;

    let registerList = instruction & 0xffff;
    let address = this.#getRegister(baseRegister)
    let index = 0

    while(registerList) {
      const register = registerList & 0x1;

      if (register) {
        if (prePost) {
          address += upDown ? 4 : -4;
          this.#memoryController.writeUint32(address, this.#getRegister(index));
        } else {
          this.#memoryController.writeUint32(address, this.#getRegister(index));
          address += upDown ? 4 : -4;
        }
      }

      registerList = registerList >> 1;

      index++
    }

    if (writeBack) this.#setRegister(baseRegister, address)
  }

  /**
   * LDM{cond}<FD|ED|FA|EA|IA|IB|DA|DB> Rn{!},<Rlist>{^}
   *
   * 31   28  27   25 24 23 22 21 20 19  16  15          0
   *   Cond     100    P  U  S  W  L   Rn    Register list
   */
  #LDMTrap = (instruction: number): void => {
    const loadStore = instruction >> 20 & 0x1;

    if (loadStore === 0) throw Error('Invalid instruction');

    const _cond = instruction >> 28 & 0xf;
    const prePost = instruction >> 24 & 0x1;
    const upDown = instruction >> 23 & 0x1;
    const _psrAndForceUserBit = instruction >> 22 & 0x1;
    const writeBack = instruction >> 21 & 0x1;
    const baseRegister = instruction >> 16 & 0xf;

    let registerList = instruction & 0xffff;
    let address = this.#getRegister(baseRegister)
    let index = 0

    while(registerList) {
      const register = registerList & 0x1;

      if (register) {
        if (prePost) {
          address += upDown ? 4 : -4;
          this.#setRegister(index, this.#memoryController.readUint32(address));
        } else {
          this.#setRegister(index, this.#memoryController.readUint32(address));
          address += upDown ? 4 : -4;
        }
      }

      registerList = registerList >> 1;

      index++
    }

    if (writeBack) this.#setRegister(baseRegister, address)
  }

  /**
    SWI{cond} imm24

    3.4.4 Software interrupt
    The software interrupt instruction (SWI) is used for getting into Supervisor mode,
    usually to request a particular supervisor function.

    When a SWI is executed, ARM7DI performs the following:
    (1) Saves the address of the SWI instruction plus 4 in R14_svc; saves CPSR in SPSR_svc
    (2) Forces M[4:0]=10011 (Supervisor mode) and sets the I bit in the CPSR
    (3) Forces the PC to fetch the next instruction from address 0x08

    To return from a SWI, use MOVS PC, R14_svc.
    This will restore the PC and CPSR and return to the instruction following the SWI.
  */
  #SVCTrap = (_instruction: number): void => {
    const systemCall = this.#getRegister(R7)
    const cpsr = this.#getRegister(CPSR);

    /* 1 Store PC - 4, to allow for pipelining, in R14_svc and store cpsr register */
    this.#setRegister(R14_SVC, this.#getRegister(PC) - 4);
    this.#setRegister(SPSR_SVC, cpsr);

    /* 2. Set supervisor mode and set I bit */
    this.#setMode(SUPERVISOR);
    this.#setRegister(CPSR, cpsr | 1 << 7);

    /* 3. Set PC to 0x08 */
    this.#setRegister(PC, 0x08);

    this.#flushPipeline();

    switch (systemCall) {
      case EXIT_SYS_CALL: {
        const exitCode = this.#getRegister(R0);

        process.exit(exitCode)
      }
      case WRITE_SYS_CALL: {
        const fd = this.#getRegister(R0);
        const bufferAddress = this.#getRegister(R1);
        const length = this.#getRegister(R2);

        const buffer = new Uint8Array(this.#memoryController.getBufferSlice(bufferAddress, length));

        if (fd === 1) process.stdout.write(buffer);

        else if (fd === 2) process.stderr.write(buffer);

        else throw Error(`Unknown file descriptor: ${fd}`);

        break;
      }
      default:
        throw Error(`Unknown system call: ${systemCall}`);
    }

    /* Restore CPSR and PC */
    this.#setRegister(PC, this.#getRegister(R14_SVC));
    this.#setRegister(CPSR, this.#getRegister(SPSR_SVC));
  }

  /**
   * 3.4.5 Undefined instruction trap
   * When the ARM7DI comes across an instruction which it cannot handle (see Chapter 4.0: Instruction Set), it
   * offers it to any coprocessors which may be present. If a coprocessor can perform this instruction but is busy
   * at that time, ARM7DI will wait until the coprocessor is ready or until an interrupt occurs. If no coprocessor
   * can handle the instruction then ARM7DI will take the undefined instruction trap.
   *
   * The trap may be used for software emulation of a coprocessor in a system which does not have the
   * coprocessor hardware, or for general purpose instruction set extension by software emulation.
   * When ARM7DI takes the undefined instruction trap it performs the following:
   *
   * (1) Saves the address of the Undefined or coprocessor instruction plus 4 in R14_und; saves CPSR in SPSR_und.
   * (2) Forces M[4:0]=11011 (Undefined mode) and sets the I bit in the CPSR
   * (3) Forces the PC to fetch the next instruction from address 0x04
   *
   * To return from this trap after emulating the failed instruction, use MOVS PC,R14_und. This will restore the
   * CPSR and return to the instruction following the undefined instruction.
   */
  #undefinedTrap = (instruction: number) => {
    /* 1. Save PC - 4, to allow for pipelining, in r14_und and save CPSR in SPSR_und */
    this.#setRegister(R14_UND, this.#getRegister(PC) - 4);
    this.#setRegister(SPSR_UND, this.#getRegister(CPSR));

    /* 2. Set undefined mode and set I bit */
    this.#setMode(UND);
    this.#setRegister(CPSR, this.#getRegister(CPSR) | 1 << 7);

    /* 3. Set PC to 0x04 */
    this.#setRegister(PC, 0x04);

    this.#flushPipeline();

    process.stderr.write(`Undefined instruction: ${instruction.toString(2).padStart(32, '0')}\n`);

    /* Restore CPSR and PC */
    this.#setRegister(PC, this.#getRegister(R14_UND));
    this.#setRegister(CPSR, this.#getRegister(SPSR_UND));
  }

  #shouldExecute(cond: number): boolean {
    const condition = this.#conditions[cond];

    if (typeof condition === 'function') return condition();

    return false
  }

  #setMode(mode: number): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~0x1f) | mode);
  }

  #getMode(): number {
    return this.#getRegister(CPSR) & 0x1f;
  }

  #getSPSR(): number {
    const mode = this.#getMode();

    switch (mode) {
      case SUPERVISOR: {
        return this.#getRegister(SPSR_SVC);
      }
      case UND: {
        return this.#getRegister(SPSR_UND);
      }
      default: {
        return 0;
      }
    }
  }

  /**
   * Sets the zero flag in the CPSR register.
   */
  #setZeroFlag(state: boolean): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~Z) | (state ? Z : 0));
  }

  /**
   * Sets the negative flag in the CPSR register.
   */
  #setNegativeFlag(state: boolean): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~N) | (state ? N : 0));
  }

  /**
   * Sets the carry flag in the CPSR register.
   */
  #setCarryFlag(state: boolean): void {
    const cpsr = this.#getRegister(CPSR);

    this.#setRegister(CPSR, (cpsr & ~C) | (state ? C : 0));
  }

  /**
   * Sets the overflow flag in the CPSR register.
   */
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

    contents += this.#getNegativeFlag(register) ? 'N' : '.';
    contents += this.#getZeroFlag(register) ? 'Z' : '.';
    contents += this.#getCarryFlag(register) ? 'C' : '.';
    contents += this.#getOverflowFlag(register) ? 'V' : '.';

    return contents
  }

  /**
   * Resets the pipeline which is needed when we branch to a new address.
   */
  #flushPipeline(): void {
    this.#pipeline.fetch = null;
    this.#pipeline.decode = null;
    this.#pipeline.execute = null;
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
    Decodes the instruction and determine the type of instruction.

    We then set the execute function to the trap function that handles the instruction.

    Note:
    This is a simple form of instruction decoding where we use the class bits to determine the type of instruction to handle.
    This however could lead to ambigious situations. So a full proof decoding mechanism should be implemented later. But for now this is fine.
  */
  #decode(): void {
    const instruction = this.#pipeline.decode;

    if (instruction === null) {
      this.#pipeline.execute = null;

      return;
    };

    let classCode = UNDEFINED

    if ((instruction >>> 21 & 0x3f) === 0 && (instruction >>> 4 & 0xf) === 0x9) {
      classCode = MULTIPLY
    } else if((instruction >>> 4 & 0xffffff) === BRANCH_EXCHANGE){
      classCode = BRANCH_EXCHANGE
    } else if ((instruction >>> 24 & 0xf) === SUPERVISOR_CALL) {
      classCode = SUPERVISOR_CALL
    } else if (instruction) {
      classCode = instruction >>> 25 & 0x7
    }

    const trap = (this.#instructionTraps[classCode] || this.#undefinedTrap) as Traps;

    this.#pipeline.execute = () => {
      let result = trap(instruction);

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