import assert from 'node:assert';
import test, { describe } from 'node:test';

import { ADD, AL, EQ, LR, MOV, MVN, PC, R0, R1, R2, SP, SUB } from '../../constants/codes';
import { b, bx, ldr, str, svc } from '../../instructions';
import { blockDataTransfer } from '../../instructions/block-data-transfer/block-data-transfer';
import { dataProcessing } from '../../instructions/data-processing/data-processing';
import { mul } from '../../instructions/multiply';
import { Memory } from '../memory/memory';
import { Assembler, VECTOR_TABLE_END } from './assembler';

const newMemory = (size = 1024): Memory => new Memory(size);

describe('Assembler', () => {
  describe('entry point', () => {
    test('returns VECTOR_TABLE_END for the default _start label', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  mov r0, #1\n`;

      const entry = assembler.assemble(source, memory);

      assert.equal(entry, VECTOR_TABLE_END);
    });

    test('returns the address of a custom entry symbol passed via args.e', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global main\n_start:\n  mov r0, #0\nmain:\n  mov r1, #1\n`;

      const entry = assembler.assemble(source, memory, { e: 'main' });

      assert.equal(entry, VECTOR_TABLE_END + 4);
    });

    test('returns 0 when the entry symbol is not declared global', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `_start:\n  mov r0, #1\n`;

      const originalWarn = console.warn;
      console.warn = () => {};

      try {
        const entry = assembler.assemble(source, memory, { e: 'missing' });

        assert.equal(entry, 0);
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  describe('text section encoding', () => {
    test('encodes MOV with an immediate operand at VECTOR_TABLE_END', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  mov r0, #1\n`, memory);

      const expected = dataProcessing({
        rd: R0,
        i: 1,
        operand2: { value: 1, type: 'ImmediateExpression' },
        opCode: MOV,
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('encodes multiple instructions at sequential 4-byte addresses', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  mov r0, #1\n  add r1, r0, #2\n  sub r2, r1, #1\n`;

      assembler.assemble(source, memory);

      const mov1 = dataProcessing({
        rd: R0,
        i: 1,
        operand2: { value: 1, type: 'ImmediateExpression' },
        opCode: MOV,
      });
      const add1 = dataProcessing({
        rd: R1,
        rn: R0,
        i: 1,
        s: 0,
        cond: AL,
        operand2: { value: 2, type: 'ImmediateExpression' },
        opCode: ADD,
      });
      const sub1 = dataProcessing({
        rd: R2,
        rn: R1,
        i: 1,
        s: 0,
        cond: AL,
        operand2: { value: 1, type: 'ImmediateExpression' },
        opCode: SUB,
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), mov1);
      assert.equal(memory.readUint32(VECTOR_TABLE_END + 4), add1);
      assert.equal(memory.readUint32(VECTOR_TABLE_END + 8), sub1);
    });

    test('rewrites mov rX, #-1 as mvn rX, #0', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  mov r0, #-1\n`, memory);

      const expected = dataProcessing({
        rd: R0,
        i: 1,
        operand2: { value: 0, type: 'ImmediateExpression' },
        opCode: MVN,
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('rewrites mov rX, #-N as mvn rX, #(-N - 1) for larger negatives', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  mov r0, #-16\n`, memory);

      const expected = dataProcessing({
        rd: R0,
        i: 1,
        operand2: { value: 15, type: 'ImmediateExpression' },
        opCode: MVN,
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('encodes MUL', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  mul r0, r1, r2\n`, memory);

      const expected = mul({ rd: R0, rm: R1, rs: R2, rn: 0 });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('encodes SVC with an immediate comment', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  svc #0\n`, memory);

      const expected = svc({ comment: 0 });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('resolves an .equiv constant when used as an SVC comment', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.equiv EXIT, 1\n.global _start\n_start:\n  svc #EXIT\n`;

      assembler.assemble(source, memory);

      const expected = svc({ comment: 1 });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('throws when an instruction appears outside the text section', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.data\n.global _start\n_start:\n  mov r0, #1\n`;

      assert.throws(() => assembler.assemble(source, memory), /Instruction outside of text section/);
    });

    test('throws when .equiv defines the same symbol twice', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.equiv FOO, 1\n.equiv FOO, 2\n.global _start\n_start:\n  mov r0, #FOO\n`;

      assert.throws(() => assembler.assemble(source, memory), /Symbol FOO already defined/);
    });
  });

  describe('branches', () => {
    test('computes a forward B offset relative to PC + 8', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  b end\n  mov r0, #1\nend:\n  mov r1, #2\n`;

      assembler.assemble(source, memory);

      const branchAddr = VECTOR_TABLE_END;
      const endAddr = VECTOR_TABLE_END + 8;
      const offset = endAddr - (branchAddr + 8);
      const expected = b({ offset: offset as 0, cond: AL, l: 0 });

      assert.equal(memory.readUint32(branchAddr), expected);
    });

    test('computes a backward B offset (loop) relative to PC + 8', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\nloop:\n  mov r0, #1\n  b loop\n`;

      assembler.assemble(source, memory);

      const branchAddr = VECTOR_TABLE_END + 4;
      const targetAddr = VECTOR_TABLE_END;
      const offset = targetAddr - (branchAddr + 8);
      const expected = b({ offset: offset as 0, cond: AL, l: 0 });

      assert.equal(memory.readUint32(branchAddr), expected);
    });

    test('encodes conditional branch (BEQ) with the correct cond field', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  beq end\n  mov r0, #1\nend:\n  mov r1, #2\n`;

      assembler.assemble(source, memory);

      const encoded = memory.readUint32(VECTOR_TABLE_END);
      const cond = (encoded >>> 28) & 0xf;

      assert.equal(cond, EQ);
    });

    test('encodes BL with L bit set', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  bl target\n  mov r0, #1\ntarget:\n  bx lr\n`;

      assembler.assemble(source, memory);

      const encoded = memory.readUint32(VECTOR_TABLE_END);
      const lBit = (encoded >>> 24) & 0x1;

      assert.equal(lBit, 1);
    });

    test('encodes BX with the target register', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  bx lr\n`, memory);

      const expected = bx({ rn: LR });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('throws when branching to an unknown label', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  b nowhere\n`;

      assert.throws(() => assembler.assemble(source, memory), /Label nowhere not found/);
    });
  });

  describe('LDR with literal pool', () => {
    test('places the literal pool after the text section and loads from it via PC-relative offset', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  ldr r0, =msg\n.data\nmsg: .word 0xdeadbeef\n`;

      assembler.assemble(source, memory);

      const ldrAddr = VECTOR_TABLE_END;
      const literalAddr = ldrAddr + 4;
      const delta = literalAddr - (ldrAddr + 8);
      const expected = ldr({
        rd: R0,
        rn: PC,
        i: 1,
        offset: { type: 'ImmediateExpression', value: Math.abs(delta) },
        u: delta > 1 ? 1 : 0,
        b: 0,
      });

      assert.equal(memory.readUint32(ldrAddr), expected);

      const msgAddress = memory.readUint32(literalAddr);
      assert.equal(memory.readUint32(msgAddress), 0xdeadbeef);
    });

    test('registers LDRB rX, =sym in the literal pool and loads the symbol address from it', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  ldrb r0, =byte_const\n.data\nbyte_const: .word 0xaa\n`;

      assembler.assemble(source, memory);

      const ldrAddr = VECTOR_TABLE_END;
      const literalAddr = ldrAddr + 4;
      const delta = literalAddr - (ldrAddr + 8);
      const expected = ldr({
        rd: R0,
        rn: PC,
        i: 1,
        offset: { type: 'ImmediateExpression', value: Math.abs(delta) },
        u: delta > 1 ? 1 : 0,
        b: 1,
      });

      assert.equal(memory.readUint32(ldrAddr), expected);

      const symAddress = memory.readUint32(literalAddr);
      assert.equal(memory.readUint32(symAddress), 0xaa);
    });
  });

  describe('LDR/STR with register base + immediate offset', () => {
    test('encodes STR with a register base and zero immediate offset', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  str r0, [sp]\n`, memory);

      const expected = str({
        i: 1,
        rd: R0,
        rn: SP,
        offset: { type: 'ImmediateExpression', value: 0 },
        b: 0,
        w: 0,
        p: 1,
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('encodes LDR with a register + immediate offset', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  ldr r0, [r1, #4]\n`, memory);

      const expected = ldr({
        i: 1,
        rd: R0,
        rn: R1,
        offset: { type: 'ImmediateExpression', value: 4 },
        b: 0,
        w: 0,
        p: 1,
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });
  });

  describe('block data transfer', () => {
    test('encodes PUSH {r0, r1} as STMDB sp! with the correct register list', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  push {r0, r1}\n`, memory);

      const expected = blockDataTransfer({
        cond: AL,
        l: 0,
        p: 1,
        u: 0,
        w: 1,
        rn: SP,
        registerList: [R0, R1],
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), expected);
    });

    test('encodes POP {r0, r1} with the L bit set', () => {
      const assembler = new Assembler();
      const memory = newMemory();

      assembler.assemble(`.global _start\n_start:\n  pop {r0, r1}\n`, memory);

      const encoded = memory.readUint32(VECTOR_TABLE_END);
      const lBit = (encoded >>> 20) & 0x1;

      assert.equal(lBit, 1);
    });
  });

  describe('data section directives', () => {
    test('writes .word values and resolves the symbol address', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global nums\n.global _start\n_start:\n  mov r0, #0\n.data\nnums: .word 0x11223344, 0xaabbccdd\n`;

      const numsAddr = assembler.assemble(source, memory, { e: 'nums' });

      assert.equal(memory.readUint32(numsAddr), 0x11223344);
      assert.equal(memory.readUint32(numsAddr + 4), 0xaabbccdd);
    });

    test('writes .ascii bytes at the symbol address without a trailing NUL', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global msg\n.global _start\n_start:\n  mov r0, #0\n.data\nmsg: .ascii "hi"\n`;

      const msgAddr = assembler.assemble(source, memory, { e: 'msg' });

      assert.equal(memory.readUint8(msgAddr), 'h'.charCodeAt(0));
      assert.equal(memory.readUint8(msgAddr + 1), 'i'.charCodeAt(0));
    });

    test('writes .zero directive as a run of zero bytes and advances the location counter', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = [
        '.global buf',
        '.global _start',
        '_start:',
        '  mov r0, #0',
        '.data',
        'buf: .zero 4',
        'sentinel: .word 0xaabbccdd',
        '',
      ].join('\n');

      for (let i = 0; i < 8; i++) memory.writeUint8(VECTOR_TABLE_END + 4 + i, 0xff);

      const bufAddr = assembler.assemble(source, memory, { e: 'buf' });

      assert.equal(memory.readUint8(bufAddr), 0);
      assert.equal(memory.readUint8(bufAddr + 1), 0);
      assert.equal(memory.readUint8(bufAddr + 2), 0);
      assert.equal(memory.readUint8(bufAddr + 3), 0);
      assert.equal(memory.readUint32(bufAddr + 4), 0xaabbccdd);
    });

    test('resolves "= . - symbol" length assignments to the number of bytes between them', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = [
        '.global len',
        '.global _start',
        '_start:',
        '  mov r0, #0',
        '.data',
        'msg: .ascii "hello"',
        'len = . - msg',
        '',
      ].join('\n');

      const lenValue = assembler.assemble(source, memory, { e: 'len' });

      assert.equal(lenValue, 'hello'.length);
    });

    test('places the data section immediately after the text section (no 0x1C gap)', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global val\n.global _start\n_start:\n  mov r0, #0\n.data\nval: .word 0xaa\n`;

      const valAddr = assembler.assemble(source, memory, { e: 'val' });

      assert.equal(valAddr, VECTOR_TABLE_END + 4);
      assert.equal(memory.readUint32(VECTOR_TABLE_END + 4), 0xaa);
    });

    test('writes .string bytes with a trailing NUL terminator', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global msg\n.global _start\n_start:\n  mov r0, #0\n.data\nmsg: .string "hi"\n`;

      const msgAddr = assembler.assemble(source, memory, { e: 'msg' });

      assert.equal(memory.readUint8(msgAddr), 'h'.charCodeAt(0));
      assert.equal(memory.readUint8(msgAddr + 1), 'i'.charCodeAt(0));
      assert.equal(memory.readUint8(msgAddr + 2), 0);
    });
  });

  describe('comment preprocessing', () => {
    test('strips @ line comments for the arm7di target', () => {
      const assembler = new Assembler();
      const memory = newMemory();
      const source = `.global _start\n_start:\n  mov r0, #1 @ load 1 into r0\n  @ a whole-line comment\n  mov r1, #2\n`;

      assembler.assemble(source, memory);

      const mov0 = dataProcessing({
        rd: R0,
        i: 1,
        operand2: { value: 1, type: 'ImmediateExpression' },
        opCode: MOV,
      });
      const mov1 = dataProcessing({
        rd: R1,
        i: 1,
        operand2: { value: 2, type: 'ImmediateExpression' },
        opCode: MOV,
      });

      assert.equal(memory.readUint32(VECTOR_TABLE_END), mov0);
      assert.equal(memory.readUint32(VECTOR_TABLE_END + 4), mov1);
    });
  });
});

