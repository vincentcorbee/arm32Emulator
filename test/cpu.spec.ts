import test, { describe } from 'node:test';
import { Memory } from '../src/modules/memory';
import { MemoryController } from '../src/modules/memory-controller';
import { CPU } from '../src/modules/cpu';
import assert from 'node:assert';
import {
  CPSR,
  M,
  PC,
  R0,
  R1,
  R10,
  R11,
  R12,
  R13,
  R14,
  R2,
  R3,
  R4,
  R5,
  R6,
  R7,
  R8,
  R9,
  SP,
  USER,
} from '../src/constants/codes';

describe('CPU', () => {
  const memory = new Memory(1024);
  const memoryController = new MemoryController();
  const cpu = new CPU(memoryController);

  memoryController.mapDevice(4, memory.buffer.byteLength, memory);

  test('General purpose regsiters should be empty', () => {
    assert.equal(cpu.getRegister(R0), 0);
    assert.equal(cpu.getRegister(R1), 0);
    assert.equal(cpu.getRegister(R2), 0);
    assert.equal(cpu.getRegister(R3), 0);
    assert.equal(cpu.getRegister(R4), 0);
    assert.equal(cpu.getRegister(R5), 0);
    assert.equal(cpu.getRegister(R6), 0);
    assert.equal(cpu.getRegister(R7), 0);
    assert.equal(cpu.getRegister(R8), 0);
    assert.equal(cpu.getRegister(R9), 0);
    assert.equal(cpu.getRegister(R10), 0);
    assert.equal(cpu.getRegister(R11), 0);
    assert.equal(cpu.getRegister(R12), 0);
    assert.equal(cpu.getRegister(R13), 0);
    assert.equal(cpu.getRegister(R14), 0);
  });

  test('CPU should be in user mode', () => {
    assert.equal(cpu.getRegister(CPSR) & M, USER);
  });

  test('Program counter should be set to 4', () => {
    cpu.setPC(4);

    assert.equal(cpu.getRegister(PC), 4);
  });

  test('Stack pointer should be set to 32', () => {
    cpu.setSP(32);

    assert.equal(cpu.getRegister(SP), 32);
  });
});
