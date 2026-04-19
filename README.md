# ARM32 Emulator

A TypeScript emulator for the ARM7DI instruction set, with its own assembler, parser-combinator
framework, a 3-stage CPU pipeline, and a memory controller that maps pluggable devices into the
address space.

All instructions are 32 bits wide and stored word-aligned.

## Features

- ARM7DI CPU with 3-stage pipeline (fetch / decode / execute)
- Banked registers and mode switching (User / Supervisor / Undefined)
- Barrel shifter: `LSL`, `LSR`, `ASR`, `ROR`, `RRX`
- Condition codes (`EQ`, `NE`, `GE`, ...) honoured on every instruction
- Memory controller with device mapping and optional address remapping
- Assembler that emits machine code directly into a `Memory` region
- Parser combinator library powering the assembler
- Minimal Linux-style syscall interface (`write`, `exit`) via `SVC`

## Requirements

- Node.js **v23.11.0** (pinned in `.nvmrc`)
- pnpm (lockfile checked in)

## Installation

```bash
pnpm install
```

## Running an example

`examples/program.ts` is an interactive stepper — `Enter` executes one CPU cycle and prints the
register state, `Ctrl+C` exits:

```bash
npx ts-node examples/program.ts loop.s
```

Or assemble a file without running it:

```bash
npx ts-node examples/assembler.ts loop.s
```

## Running tests

```bash
pnpm test
```

Runs `node --test` against every `*.spec.ts` under `src/` and `test/`.

To run a single spec:

```bash
node --test --require ts-node/register test/mov/mov.spec.ts
```

## Quick start (API)

```ts
import { readFileSync } from 'node:fs';
import { CPU, Memory, MemoryController } from './src';
import { Assembler } from './src/modules/assembler/assembler';

const assembler = new Assembler();
const memoryController = new MemoryController();
const memory = new Memory(1024);

memoryController.mapDevice(0, memory.buffer.byteLength, memory);

const cpu = new CPU(memoryController);
const source = readFileSync('examples/loop.s', 'utf-8');
const start = assembler.assemble(source, memory, { e: '_start' });

cpu.setPC(start);
cpu.setSP(memory.buffer.byteLength);
cpu.run();
```

`Assembler#assemble` writes the encoded program into the provided `Memory` and returns the
address of the entry-point symbol (default `_start`). The text section starts at `0x1C` so the
exception vector table (see below) is left intact at the bottom of memory.

Call `cpu.cycle()` instead of `cpu.run()` to step the pipeline one tick at a time. Use
`cpu.viewRegisters()` to dump the register bank.

## Supported instructions

| Class                 | Mnemonics                                          |
|-----------------------|----------------------------------------------------|
| Data processing       | `MOV`, `MVN`, `CMP`, `ADD`, `SUB`                  |
| Multiply              | `MUL`                                              |
| Single data transfer  | `LDR`, `LDRB`, `STR`, `STRB`                       |
| Block data transfer   | `LDM`, `STM` (`FD`/`ED`/`FA`/`EA`/`IA`/`IB`/`DA`/`DB`) |
| Stack (sugar)         | `PUSH`, `POP`                                      |
| Branch                | `B`, `BL`, `BX`                                    |
| Supervisor call       | `SVC`                                              |

Most instructions accept a `{cond}` suffix and `ADD`/`SUB`/`MUL` also accept `{S}` to set CPSR
flags. See [docs/grammar.md](docs/grammar.md) for the exact syntax each instruction accepts.

## Supported directives

| Directive  | Example                                    |
|------------|--------------------------------------------|
| `.text`    | `.text` or `.text "section_name"`          |
| `.data`    | `.data`                                    |
| `.global`  | `.global _start`                           |
| `.ascii`   | `msg: .ascii "Hello, World!\n"`            |
| `.string`  | `msg: .string "Hello, World!"` (appends `\n`) |
| `.word`    | `list: .word 1, 2, 3, 4`                   |
| `.float`   | `pi: .float 3.14159`                       |
| `.zero`    | `buf: .zero 16`                            |
| `.equiv`   | `.equiv WRITE, 4`                          |
| *symbol =* | `length = . - start`                       |

## Syscalls

Invoke with `SVC #0`; syscall number goes in `R7`, result in `R0`:

| R7 | Name  | Arguments                              |
|----|-------|----------------------------------------|
| 1  | exit  | `R0` = status                          |
| 4  | write | `R0` = fd, `R1` = buffer, `R2` = count |

## Examples

All example assembly sources live in [`examples/`](examples/) and run via
`npx ts-node examples/program.ts <file>`:

| File           | Demonstrates                                                        |
|----------------|---------------------------------------------------------------------|
| `loop.s`       | Loop over a string and write each byte with newline via syscalls    |
| `function.s`   | Array sum using a `BL` / `BX LR` function call                      |
| `stack.s`      | C-style function with stacked 5th argument (`MUL` fan-out)          |
| `stack-b.s`    | Minimal `STMFD` / `LDMFD` push/pop pair                             |
| `store.s`      | `STRB` / `LDRB` on a `.zero`-reserved buffer                        |
| `float.s`      | Loading a `.float` constant into a register                         |
| `negative.s`   | Signed arithmetic (`SUBS`) and storing a negative value on the stack |
| `comments.s`   | `@` single-line comments                                            |
| `test.s`       | Conditional branch with labelled data / string length computation   |

## Architecture

- `CPU` (`src/modules/cpu`) — register bank, 3-stage pipeline, instruction decoder and
  dispatcher. Never touches raw memory; all loads and stores go through a `MemoryController`.
- `Memory` (`src/modules/memory`) — `ArrayBuffer` + `DataView` with configurable endianness.
  Implements the `DeviceInterface` consumed by the memory controller.
- `MemoryController` (`src/modules/memory-controller`) — maps one or more devices into the
  address space. `mapDevice(start, end, device, remap?)` controls whether a device sees its
  absolute address or a rebased local one.
- `Assembler` (`src/modules/assembler`) — two-pass: pre-process (strip comments) → parse
  (build AST via parser combinators) → emit (walk AST, encode instructions, resolve labels and
  literal pools into the target `Memory`).
- `parser-combinators` (`src/modules/parser-combinators`) — generic combinator library
  (`sequence`, `either`, `many`, `map`, `char`, …) used by the assembler.
- `instructions` (`src/instructions`) — per-mnemonic encoders that produce 32-bit words per the
  ARM encoding format. Shared between the assembler and the unit tests.

## ARM instruction encoding (bits 27–25)

| Bits 27–25 | Instruction type        | Examples                      |
|------------|-------------------------|-------------------------------|
| `000`      | Data processing / multiply | `ADD`, `SUB`, `MOV`, `AND`, `CMP`, `MUL` |
| `001`      | Data processing (immediate `I=1`) | `ADD`, `SUB` with `#imm`      |
| `010`      | Load/store single data  | `LDR`, `STR`                  |
| `011`      | Undefined               | Reserved                      |
| `100`      | Load/store multiple     | `LDM`, `STM`                  |
| `101`      | Branch                  | `B`, `BL`                     |
| `110`      | Coprocessor             | `MRC`, `CDP` *(not implemented)* |
| `111`      | SVC / exception (bit 24 = 1) | `SVC`                         |

Rows 000 and 001 share the data-processing decoder; the `I` bit selects immediate vs. register
second operand.

## Exception vector table

Addresses 0x00000000–0x0000001C are reserved for the ARM exception vector table. The assembler
places the first instruction at `VECTOR_TABLE_END = 0x1C`.

| Address     | Exception             | Mode on entry |
|-------------|-----------------------|---------------|
| 0x00000000  | Reset                 | Supervisor    |
| 0x00000004  | Undefined instruction | Undefined     |
| 0x00000008  | Software interrupt    | Supervisor    |
| 0x0000000C  | Abort (prefetch)      | Abort         |
| 0x00000010  | Abort (data)          | Abort         |
| 0x00000014  | — reserved —          | —             |
| 0x00000018  | IRQ                   | IRQ           |
| 0x0000001C  | FIQ                   | FIQ           |

## Assembly grammar

See [docs/grammar.md](docs/grammar.md) for the full BNF. The grammar is enforced by the parser
combinators under `src/modules/assembler/parsers/`.

## References

- ARM7DI datasheet: [`docs/DDI0027D_7di_ds.pdf`](docs/DDI0027D_7di_ds.pdf)
- ELF format: [`docs/elf.pdf`](docs/elf.pdf), [man 5 elf](https://man7.org/linux/man-pages/man5/elf.5.html)
- [ARM / Thumb instruction set overview](https://developer.arm.com/documentation/dui0473/m/overview-of-the-arm-architecture/arm-and-thumb-instruction-set-overview)
- [A32 instructions by encoding](https://developer.arm.com/documentation/ddi0597/2024-12/A32-Instructions-by-Encoding?lang=en)
- [Overflow and carry notes](https://teaching.idallen.com/dat2343/10f/notes/040_overflow.txt)
- [ECMA-262: StringNumericValue](https://tc39.es/ecma262/#sec-runtime-semantics-stringnumericvalue) — reference for the numeric literal semantics used by the assembler

## License

ISC — V.J.M. Corbee
