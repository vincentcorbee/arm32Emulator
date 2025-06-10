import { readFileSync } from 'node:fs';
import { CPU, Memory, MemoryController } from '../src';
import path from 'node:path';
import { Assembler } from '../src/modules/assembler/assembler';

const args = process.argv.slice(2);
const [file] = args;
const source = readFileSync(path.resolve(__dirname, file), 'utf-8').replaceAll('\\n', '\n');

const assembler = new Assembler();
const memoryController = new MemoryController();
const memory = new Memory(1024);

memoryController.mapDevice(0, memory.buffer.byteLength, memory);

const cpu = new CPU(memoryController);
const start = assembler.assemble(source, memory, { e: '_start' });
const input = process.stdin;

/* Set the program counter to the start of the program */
cpu.setPC(start);

/* Set the stack pointer to bottom of memory region */
cpu.setSP(memory.buffer.byteLength);

// memory.view()

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

// cpu.run()
