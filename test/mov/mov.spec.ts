import test, { describe } from 'node:test';
import { R0, R1, R2, R3 } from '../../src/constants/codes';
import { mov } from '../../src/instructions';
import { CPU, Memory, MemoryController } from '../../src/modules';
import assert from 'node:assert';

describe('MOV instruction', () => {
  const memory = new Memory(1024);
  const memoryController = new MemoryController();
  const cpu = new CPU(memoryController);

  const instructions = [
    mov({ rd: R0, i: 1, operand2: { value: 2, type: 'ImmidiateExpression' } }),
    mov({ rd: R1, i: 1, operand2: { value: 4, type: 'ImmidiateExpression' } }),
    mov({ rd: R2, i: 0, operand2: { value: R0, type: 'Register' } }),
    mov({ rd: R3, i: 1, s: 1, operand2: { value: -1, type: 'ImmidiateExpression' } }),
  ];

  instructions.forEach((instruction, i) => memory.writeUint32(i * 4, instruction));

  memoryController.mapDevice(0, memory.buffer.byteLength, memory);

  cpu.setPC(0);

  test('registers R0, R1, R2, and R3, should be empty', () => {
    assert.equal(cpu.getRegister(R0), 0);
    assert.equal(cpu.getRegister(R1), 0);
    assert.equal(cpu.getRegister(R2), 0);
    assert.equal(cpu.getRegister(R3), 0);
  });

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

  test('registers R3 should contain 0x000000ff', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R3), 0xff);
  });
});
