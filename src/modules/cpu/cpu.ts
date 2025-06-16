import { Memory } from '../memory';
import { MemoryController } from '../memory-controller/types';
import {
  BlockDataTransferHandlers,
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
  SingleDataTransferHandlers,
} from './types';
import { REGISTERS } from './constants';
import {
  CPSR,
  LR,
  PC,
  R0,
  R1,
  R14_SVC,
  R14_UND,
  R2,
  R7,
  SP,
  SPSR,
  SPSR_SVC,
  SPSR_UND,
} from '../../constants/codes/registers';
import {
  BLOCK_DATA_TRANSFER,
  BRANCH,
  BRANCH_EXCHANGE,
  DATA_PROCESSING_IMMEDIATE,
  DATA_PROCESSING_REGISTER,
  MULTIPLY,
  SINGLE_DATA_TRANSFER_IMMIDIATE,
  SINGLE_DATA_TRANSFER_REGISTER,
  SUPERVISOR_CALL,
  UNDEFINED,
} from '../../constants/codes/class-codes';
import { C, N, V, Z } from '../../constants/codes/flags';
import { N as N_FLAG, C as C_FLAG, Z as Z_FLAG, V as V_FLAG } from '../../constants/mnemonics/flags';
import { AL, EQ, GE, GT, LE, LT, NE } from '../../constants/codes/condition';
import { M, SUPERVISOR, UND, USER } from '../../constants/codes/modes';
import { ADD, CMP, MOV, MVN, SUB } from '../../constants/codes/op-codes';
import { ASR, LSL, LSR, ROR, RRX } from '../../constants/codes/shift-types';
import { SHIFT_SOURCE_REGISTER } from '../../constants/codes/shift-source';
import { EXIT_SYS_CALL, WRITE_SYS_CALL } from '../../constants/codes/sys-calls';
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
  #singleDataTransferHandlers: SingleDataTransferHandlers;
  #blockDataTransferHandlers: BlockDataTransferHandlers;
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
      [SUPERVISOR_CALL]: this.#SVCTrap,
      [SINGLE_DATA_TRANSFER_REGISTER]: this.#singleDataTransferHandler,
      [SINGLE_DATA_TRANSFER_IMMIDIATE]: this.#singleDataTransferHandler,
      [BRANCH]: this.#BHandler,
      [BLOCK_DATA_TRANSFER]: this.#blockDataTransferHandler,
      [MULTIPLY]: this.#MULHandler,
      [UNDEFINED]: this.#undefinedTrap,
      [BRANCH_EXCHANGE]: this.#BXHandler,
    };

    this.#dataProcessingHandlers = {
      [MOV]: this.#MOVHandler,
      [MVN]: this.#MVNHandler,
      [ADD]: this.#ADDHandler,
      [SUB]: this.#SUBHandler,
      [CMP]: this.#CMPHandler,
    };

    this.#singleDataTransferHandlers = {
      [1]: this.#LDRHandler,
      [0]: this.#STRHandler,
    };

    this.#blockDataTransferHandlers = {
      [1]: this.#LDMHandler,
      [0]: this.#STMHandler,
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

  /**
    The CPU uses a three-stage pipeline.
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
    4x   2x x 4x     x 4x 4x 12x
    Cond 00 I Opcode S Rn Rd Op2

    If the S bit is set (and Rd is not R15) the V flag in the CPSR will be set
    if an overflow occurs into bit 31 of the result;
    this may be ignored if the operands were considered unsigned, but warns
    of a possible error if the operands were 2's complement signed.
    The C flag will be set to the carry out of bit 31 of the ALU, the Z flag will be set if and only if the
    result was zero, and the N flag will be set to the value of bit 31 of the result (indicating a negative result if
    the operands are considered to be 2's complement signed).
  */
  #dataProcessingHandler = (instruction: Instruction) => {
    return this.#dataProcessingHandlers[(instruction >> 21) & 0xf];
  };

  /**
    4x   x x x x x x x x 4x 4x 12x
    Cond 0 1 I P U B W L Rn Rd Offset
  */
  #singleDataTransferHandler = (instruction: Instruction) => {
    return this.#singleDataTransferHandlers[(instruction >> 20) & 0x1];
  };

  /**
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
  #blockDataTransferHandler = (instruction: Instruction) => {
    const loadStore = (instruction >> 20) & 0x1;

    return this.#blockDataTransferHandlers[loadStore];
  };

  /**
   * B{L}{cond} <expression>
   *
   * 4x   x x x x 24x
   * Cond 1 0 1 L offset
   */
  #BHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const l = (instruction >> 24) & 0x1;
    const offset = instruction & 0xffffff;
    const sign = (offset >>> 23) & 0x1;
    const pc = this.#getRegister(PC);
    const signedOffset = sign ? ((0xff << 24) >>> 0) | offset : offset;

    this.#setRegister(PC, pc + signedOffset);

    /* Adjust PC to allow prefetching */
    if (l) this.#setRegister(LR, pc - 4);

    this.#flushPipeline();
  };

  /**
   * BX{cond} Rn
   */
  #BXHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const rn = instruction & 0xf;

    this.#setRegister(PC, this.#getRegister(rn));
    this.#flushPipeline();
  };

  /**
   * CMP{cond} Rn, <Op2>
   */
  #CMPHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const rn = (instruction >> 16) & 0xf;
    const left = this.#getRegister(rn);
    const { value: right } = this.#getSecondOperandValue(instruction);
    const result = left - right;

    const signLeft = (left >>> 31) & 0x1;
    const signRight = (right >>> 31) & 0x1;
    const signResult = (result >>> 31) & 0x1;

    const overflow = signLeft !== signRight && signLeft !== signResult;
    const carry = left >>> 0 >= right >>> 0;
    const negative = signResult === 1;
    const zero = result === 0;

    this.#setCarryFlag(carry);
    this.#setOverflowFlag(overflow);
    this.#setNegativeFlag(negative);
    this.#setZeroFlag(zero);
  };

  /**
    MOV{cond}{S} Rd, <Op2>

    4x   2x x 4x     x 4x 4x 12x
    Cond 00 I Opcode S Rn Rd Op2
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
    MVN{cond}{S} Rd, <Op2>

    4x   2x x 4x     x 4x 4x 12x
    Cond 00 I Opcode S Rn Rd Op2
  */
  #MVNHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const rd = (instruction >> 12) & 0xf;
    const s = (instruction >> 20) & 0x1;
    const { carry, value } = this.#getSecondOperandValue(instruction);
    const negatedValue = ~value;

    this.#setRegister(rd, negatedValue);

    if (s) {
      this.#setCarryFlag(carry === 1);
      this.#setNegativeFlag(((negatedValue >>> 31) & 0x1) === 1);
      this.#setZeroFlag(negatedValue === 0);
    }
  };

  /**
   * ADD{cond}{S} Rd, Rn, <Op2>
   *
   * 4x   2x x 4x     x 4x 4x 12x
   * Cond 00 I Opcode S Rn Rd Op2
   */
  #ADDHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const s = (instruction >> 20) & 0x1;
    const rn = (instruction >> 16) & 0xf;
    const rd = (instruction >> 12) & 0xf;
    const left = this.#getRegister(rn);
    const { value: right } = this.#getSecondOperandValue(instruction);
    const result = left + right;

    this.#setRegister(rd, result);

    if (s) {
      const signLeft = (left >>> 31) & 0x1;
      const signRight = (right >>> 31) & 0x1;
      const signResult = (result >>> 31) & 0x1;

      const overflow = signLeft === signRight && signLeft !== signResult;
      const carry = (left >>> 0) + (right >>> 0) > 0xffffffff;
      const negative = signResult === 1;
      const zero = result === 0;

      this.#setCarryFlag(carry);
      this.#setOverflowFlag(overflow);
      this.#setNegativeFlag(negative);
      this.#setZeroFlag(zero);
    }
  };

  /**
   * SUB{S}{cond} Rd, Rn, <Op2>
   *
   * 4x   2x x 4x     x 4x 4x 12x
   * Cond 00 I Opcode S Rn Rd Op2
   */
  #SUBHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const s = (instruction >> 20) & 0x1;
    const rn = (instruction >> 16) & 0xf;
    const rd = (instruction >> 12) & 0xf;
    const left = this.#getRegister(rn);
    const { value: right } = this.#getSecondOperandValue(instruction);
    const result = left - right;

    this.#setRegister(rd, result);

    if (s) {
      const signLeft = (left >>> 31) & 0x1;
      const signRight = (right >>> 31) & 0x1;
      const signResult = (result >>> 31) & 0x1;

      const overflow = signLeft !== signRight && signLeft !== signResult;
      const carry = left >>> 0 >= right >>> 0;
      const negative = signResult === 1;
      const zero = result === 0;

      this.#setCarryFlag(carry);
      this.#setOverflowFlag(overflow);
      this.#setNegativeFlag(negative);
      this.#setZeroFlag(zero);
    }
  };

  /**
   * MUL{cond}{S} Rd, Rm, Rs
   *
   * 31  28 27             22 21 20 19 16 15 12 11 8 7     4 3  0
   *  Cond  0  0  0  0  0  0  A  S   Rd    Rn    Rs  1 0 0 1  Rm
   */
  #MULHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const a = (instruction >> 21) & 0x1;

    if (a === 1) throw Error('Invalid instruction');

    const s = (instruction >> 20) & 0x1;
    const rd = (instruction >> 16) & 0xf;
    const rs = (instruction >> 8) & 0xf;
    const rm = instruction & 0xf;
    const left = this.#getRegister(rm);
    const right = this.#getRegister(rs);
    const result = left * right;

    this.#setRegister(rd, result);

    if (s) {
      this.#setNegativeFlag(((result >>> 31) & 0x1) === 1);
      this.#setZeroFlag(result === 0);
    }
  };

  /**
   * LDR{cond}{B}{T} Rd, <Address>
   *
   * 4x   x x x x x x x x 4x 4x 12x
   * Cond 0 1 I P U B W L Rn Rd Offset
   */
  #LDRHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const immediate = (instruction >> 25) & 0x1;
    const loadStore = (instruction >> 20) & 0x1;

    if (loadStore === 0) throw Error('Invalid instruction');

    const writeBack = (instruction >> 21) & 0x1;
    const byteWord = (instruction >> 22) & 0x1;
    const upDown = (instruction >> 23) & 0x1;
    const prePost = (instruction >> 24) & 0x1;
    const baseRegister = (instruction >> 16) & 0xf;
    const destinationRegister = (instruction >> 12) & 0xf;
    const offset = instruction & 0xfff;
    const offsetValue = (immediate ? offset : this.#getRegister(offset & 0xf)) * (upDown ? 1 : -1);
    const addressBase = this.#getRegister(baseRegister);
    const address = prePost || (!prePost && !writeBack) ? addressBase + offsetValue : addressBase;

    this.#setRegister(
      destinationRegister,
      byteWord ? this.#memoryController.readUint8(address) : this.#memoryController.readUint32(address),
    );

    if (writeBack) {
      this.#setRegister(baseRegister, prePost ? address : address + offsetValue);
    }
  };

  /**
   * STR{cond}{B}{T} Rd, <Address>
   *
   * 4x   x x x x x x x x 4x 4x 12x
   * Cond 0 1 I P U B W L Rn Rd Offset
   */
  #STRHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const immediate = (instruction >> 25) & 0x1;
    const loadStore = (instruction >> 20) & 0x1;

    if (loadStore === 1) throw Error('Invalid instruction');

    const writeBack = (instruction >> 21) & 0x1;
    const byteWord = (instruction >> 22) & 0x1;
    const upDown = (instruction >> 23) & 0x1;
    const prePost = (instruction >> 24) & 0x1;
    const baseRegister = (instruction >> 16) & 0xf;
    const sourceRegister = (instruction >> 12) & 0xf;
    const offset = instruction & 0xfff;
    const offsetValue = (immediate ? offset : this.#getRegister(offset & 0xf)) * (upDown ? 1 : -1);
    const addressBase = this.#getRegister(baseRegister);
    const address = prePost ? addressBase + offsetValue : addressBase;
    const value = this.#getRegister(sourceRegister);

    if (byteWord) {
      this.#memoryController.writeUint8(address, value);
    } else {
      this.#memoryController.writeUint32(address, value);
    }

    if (writeBack) {
      this.#setRegister(baseRegister, prePost ? address : address + offsetValue);
    }
  };

  /**
   * STM{cond}<FD|ED|FA|EA|IA|IB|DA|DB> Rn{!}, <Rlist>{^}
   *
   * 31   28  27   25 24 23 22 21 20 19  16  15          0
   *   Cond     100    P  U  S  W  L   Rn    Register list
   *
   */
  #STMHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const loadStore = (instruction >> 20) & 0x1;

    if (loadStore === 1) throw Error('Invalid instruction');

    const prePost = (instruction >> 24) & 0x1;
    const upDown = (instruction >> 23) & 0x1;
    const _psrAndForceUserBit = (instruction >> 22) & 0x1;
    const writeBack = (instruction >> 21) & 0x1;
    const baseRegister = (instruction >> 16) & 0xf;

    let registerList = instruction & 0xffff;
    let address = this.#getRegister(baseRegister);
    let index = 0;

    while (registerList) {
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

      index++;
    }

    if (writeBack) this.#setRegister(baseRegister, address);
  };

  /**
   * LDM{cond}<FD|ED|FA|EA|IA|IB|DA|DB> Rn{!}, <Rlist>{^}
   *
   * 31   28  27   25 24 23 22 21 20 19  16  15          0
   *   Cond     100    P  U  S  W  L   Rn    Register list
   */
  #LDMHandler = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const loadStore = (instruction >> 20) & 0x1;

    if (loadStore === 0) throw Error('Invalid instruction');

    const prePost = (instruction >> 24) & 0x1;
    const upDown = (instruction >> 23) & 0x1;
    const _psrAndForceUserBit = (instruction >> 22) & 0x1;
    const writeBack = (instruction >> 21) & 0x1;
    const baseRegister = (instruction >> 16) & 0xf;

    let registerList = instruction & 0xffff;
    let address = this.#getRegister(baseRegister);
    let index = Math.floor(Math.log2(registerList));

    while (index > -1) {
      const register = (registerList >> index) & 0x1;

      if (register) {
        if (prePost) {
          address += upDown ? 4 : -4;
          this.#setRegister(index, this.#memoryController.readUint32(address));
        } else {
          this.#setRegister(index, this.#memoryController.readUint32(address));
          address += upDown ? 4 : -4;
        }
      }

      index--;
    }

    if (writeBack) this.#setRegister(baseRegister, address);
  };

  /**
    SVC{cond} imm24

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
  #SVCTrap = (instruction: Instruction): void => {
    if (!this.#shouldExecute(instruction)) return;

    const systemCall = this.#getRegister(R7);
    const cpsr = this.#getRegister(CPSR);

    /* 1 Store PC - 4, to allow for pipelining, in R14_svc and store cpsr register */
    this.#setRegister(R14_SVC, this.#getRegister(PC) - 4);
    this.#setRegister(SPSR_SVC, cpsr);

    /* 2. Set supervisor mode and set I bit */
    this.#setMode(SUPERVISOR);
    this.#setRegister(CPSR, cpsr | (1 << 7));

    /* 3. Set PC to 0x08 */
    this.#setRegister(PC, 0x08);

    this.#flushPipeline();

    switch (systemCall) {
      case EXIT_SYS_CALL: {
        const exitCode = this.#getRegister(R0) & 0xff;

        process.exit(exitCode);
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
  };

  /**
   * 3.4.5 Undefined instruction trap
   *
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
  #undefinedTrap = (instruction: Instruction) => {
    /* 1. Save PC - 4, to allow for pipelining, in r14_und and save CPSR in SPSR_und */
    this.#setRegister(R14_UND, this.#getRegister(PC) - 4);
    this.#setRegister(SPSR_UND, this.#getRegister(CPSR));

    /* 2. Set undefined mode and set I bit */
    this.#setMode(UND);
    this.#setRegister(CPSR, this.#getRegister(CPSR) | (1 << 7));

    /* 3. Set PC to 0x04 */
    this.#setRegister(PC, 0x04);

    this.#flushPipeline();

    process.stderr.write(`Undefined instruction: ${instruction.toString(2).padStart(32, '0')}\n`);

    /* Restore CPSR and PC */
    this.#setRegister(PC, this.#getRegister(R14_UND));
    this.#setRegister(CPSR, this.#getRegister(SPSR_UND));
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

  /**
   * Resets the pipeline which is needed when we branch to a new address.
   */
  #flushPipeline(): void {
    this.#pipeline.fetch = null;
    this.#pipeline.decode = null;
    this.#pipeline.execute = null;
  }

  #getClassCode(instruction: number): number {
    if (((instruction >>> 21) & 0x3f) === 0 && ((instruction >>> 4) & 0xf) === MULTIPLY) {
      return MULTIPLY;
    } else if (((instruction >>> 4) & 0xffffff) === BRANCH_EXCHANGE) {
      return BRANCH_EXCHANGE;
    } else if (((instruction >>> 24) & 0xf) === SUPERVISOR_CALL) {
      return SUPERVISOR_CALL;
    }

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
