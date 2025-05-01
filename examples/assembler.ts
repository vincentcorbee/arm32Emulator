import { readFileSync } from "node:fs";
import { Assembler } from "../src/modules/assembler/assembler";
import path from "node:path";
import { Memory, MemoryController } from "../src";

const assembler = new Assembler()

const args = process.argv.slice(2)
const [file] = args
const source = readFileSync(path.resolve(__dirname, file), 'utf-8').replaceAll('\\n', '\n')

const memoryController = new MemoryController()
const memory = new Memory(1024);

assembler.assemble(source, memory, { e: '_start' })

