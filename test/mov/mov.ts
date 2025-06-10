import { R0, R1, R2 } from '../../src/constants/codes';
import { mov } from '../../src/instructions';
import { CPU, Memory, MemoryController } from '../../src/modules';

const memory = new Memory(1024);
const memoryController = new MemoryController();
const cpu = new CPU(memoryController);
const input = process.stdin;

const instructions = [
  mov({ rd: R0, i: 1, operand2: { value: 2, type: 'ImmidiateExpression' } }),
  mov({ rd: R1, i: 1, operand2: { value: 4, type: 'ImmidiateExpression' } }),
  mov({ rd: R2, i: 0, operand2: { value: R0, type: 'Register' } }),
];

instructions.forEach((instruction, i) => memory.writeUint32(i * 4, instruction));

memoryController.mapDevice(0, memory.buffer.byteLength, memory);

cpu.setPC(0);

cpu.viewRegisters();

process.on('exit', () => {
  console.log();
  cpu.viewRegisters();
  memory.viewAt(0x3fc);
});

input.setRawMode(true);

input.on('data', (data) => {
  const token = data.toString();

  switch (token) {
    case '\x03': {
      process.exit();
    }
    case '\r': {
      cpu.cycle();
      cpu.viewRegisters();
      break;
    }
  }
});
