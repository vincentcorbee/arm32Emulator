import test, { describe } from 'node:test';
import {
  CPSR,
  LSL,
  LSR,
  N,
  R0,
  R1,
  R2,
  R3,
  R4,
  SHIFT_SOURCE_IMMEDIATE,
  SHIFT_SOURCE_REGISTER,
} from '../../src/constants/codes';
import { mov } from '../../src/instructions';
import { CPU, Memory, MemoryController } from '../../src/modules';
import assert from 'node:assert';

describe('MOV instruction', () => {
  const memory = new Memory(1024);
  const memoryController = new MemoryController();
  const cpu = new CPU(memoryController);

  const instructions = [
    mov({ rd: R0, i: 1, operand2: { value: 2, type: 'ImmediateExpression' } }),
    mov({ rd: R1, i: 1, operand2: { value: 4, type: 'ImmediateExpression' } }),
    mov({ rd: R2, i: 0, operand2: { value: R0, type: 'Register' } }),
    mov({
      rd: R2,
      i: 0,
      operand2: { value: R0, type: 'Register', shift: { source: SHIFT_SOURCE_REGISTER, type: LSL, register: R0 } },
    }),
    mov({
      rd: R2,
      i: 0,
      operand2: { value: R1, type: 'Register', shift: { source: SHIFT_SOURCE_IMMEDIATE, type: LSR, amount: 1 } },
    }),
    mov({ rd: R3, i: 1, s: 1, operand2: { value: -1, type: 'ImmediateExpression' } }),
    mov({ rd: R4, i: 1, s: 1, operand2: { value: 255, type: 'ImmediateExpression', rotate: 2 } }),
  ];

  instructions.forEach((instruction, i) => memory.writeUint32(i * 4, instruction));

  memoryController.mapDevice(0, memory.buffer.byteLength, memory);

  cpu.setPC(0);

  test('registers R0 should contain 0x00000002', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R0), 0x2);
  });

  test('registers R1 should contain 0x00000004', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R1), 0x4);
  });

  test('registers R2 should contain 0x00000002', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R2), 0x2);
  });

  test('registers R2 should have a register value shifted by a register', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R2), 0x8);
  });

  test('registers R2 should have a register value shifted by a immediate value', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R2), 0x2);
  });

  test('registers R3 should contain 0x000000ff and N flag should not be set', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R3), 0xff);
    assert.equal((cpu.getRegister(CPSR) & N) >>> 0 ? 1 : 0, 0);
  });

  test('registers R4 should contain a rotated value by 2', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R4), 0xff000000);
  });
});
