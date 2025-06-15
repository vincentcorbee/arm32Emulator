import test, { describe } from 'node:test';
import { CPSR, N, R0, R1 } from '../../src/constants/codes';
import { mvn } from '../../src/instructions';
import { CPU, Memory, MemoryController } from '../../src/modules';
import assert from 'node:assert';

describe('MVN instruction', () => {
  const memory = new Memory(1024);
  const memoryController = new MemoryController();
  const cpu = new CPU(memoryController);

  const instructions = [
    mvn({ rd: R0, i: 1, operand2: { value: 2, type: 'ImmediateExpression' } }),
    mvn({ rd: R1, i: 1, s: 1, operand2: { value: 0, type: 'ImmediateExpression' } }),
  ];

  instructions.forEach((instruction, i) => memory.writeUint32(i * 4, instruction));

  memoryController.mapDevice(0, memory.buffer.byteLength, memory);

  cpu.setPC(0);

  test('registers R0 should contain 0xFFFFFFFD', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R0), 0xfffffffd);
  });

  test('registers R1 should contain 0xFFFFFFFF and N flag should be set', () => {
    cpu.cycle();

    assert.equal(cpu.getRegister(R1), 0xffffffff);
    assert.equal((cpu.getRegister(CPSR) & N) >>> 0 ? 1 : 0, 1);
  });
});
