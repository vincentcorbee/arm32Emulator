# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install deps: `pnpm install` (pnpm-lock.yaml is checked in; Node version pinned via `.nvmrc` to v23.11.0)
- Run full test suite: `pnpm test` — runs `node --test --require ts-node/register ./**/*.spec.ts`, which discovers specs both in `test/**` and colocated `src/**/*.spec.ts`
- Run a single spec: `node --test --require ts-node/register path/to/file.spec.ts` (e.g. `test/mov/mov.spec.ts`)
- Run an assembly program interactively: `npx ts-node examples/program.ts <file.s>` — press Enter to step one `cpu.cycle()`, Ctrl+C to exit. Paths are resolved relative to `examples/`.
- Assemble only (no CPU): `npx ts-node examples/assembler.ts <file.s>`
- There is no build/lint script. Formatting is Prettier (`.prettierrc`: single quotes, semi, 120 width, trailing comma all, 2-space indent).

## Architecture

This is a TypeScript ARM32 (ARM7DI) emulator. The pipeline is: **assembly source → Assembler (parse + encode) → Memory (via MemoryController) → CPU (fetch/decode/execute)**. Each stage lives in its own module under `src/modules/` and is wired together in the example programs.

### Layering

Public surface is `src/index.ts` → `src/modules/index.ts`, which re-exports `CPU`, `Memory`, and `MemoryController`. The `Assembler` is imported directly from `src/modules/assembler/assembler.ts` (not re-exported). Constants, instruction encoders, and types live under `src/constants`, `src/instructions`, and `src/types` and are imported by both the assembler and the CPU so that op-code numbers, class codes, register codes, condition codes, and shift codes are defined in exactly one place.

### CPU (`src/modules/cpu/cpu.ts`)

- Owns the register bank as a separate `Memory` (`#registerMemory`) indexed via a `RegistersMap` that encodes banked registers per mode (`R14_SVC`, `SPSR_SVC`, `R14_UND`, `SPSR_UND`, etc. in `src/constants/codes/registers.ts`).
- Implements a 3-stage `#pipeline` (`{ fetch, decode, execute }`). `cpu.cycle()` advances one tick — fetching the next word from the memory controller, decoding the previous fetch, and executing the previous decode. `cpu.run()` loops cycles.
- Dispatches instructions through layered handler tables built in the constructor:
  - `#instructionHandlers` keyed by **class code** (bits 27–25 plus bit 4 discrimination for `BRANCH_EXCHANGE`) — see `src/constants/codes/class-codes.ts`.
  - `#dataProcessingHandlers` keyed by **op-code** (MOV/MVN/ADD/SUB/CMP).
  - `#singleDataTransferHandlers` / `#blockDataTransferHandlers` keyed by L-bit (load vs store).
  - `#conditionHandlers` evaluates the condition field (EQ/NE/GE/GT/LE/LT/AL) against CPSR flags (N/Z/C/V) before any instruction executes.
  - `#shiftHandlers` implements LSL/LSR/ASR/ROR/RRX for the barrel shifter in the second-operand path.
- Supervisor calls go through `#SVCTrap`, which banks registers into SVC mode, jumps to the SWI vector (`0x00000008`), and dispatches syscalls (WRITE/EXIT — see `src/constants/codes/sys-calls.ts`).
- **The CPU never touches raw memory**: all loads/stores go through the injected `MemoryController`.

### Memory + MemoryController (`src/modules/memory`, `src/modules/memory-controller`)

- `Memory` wraps an `ArrayBuffer` + `DataView` with endianness (default little). It exposes `readUint8/16/32`, `writeUint8/16/32`, `writeInt32`, and `getBufferSlice` — this is the `DeviceInterface`.
- `MemoryController` maps devices into address ranges via `mapDevice(start, end, device, remap?)`. New regions are `unshift`ed, so later mappings shadow earlier ones. When `remap: true`, the controller rebases the address into the device's local space (`address - start`); otherwise it passes the raw address. Instantiate a `MemoryController`, then `mapDevice` one or more `Memory` instances (or any custom device implementing the same interface) before handing it to the CPU.

### Assembler (`src/modules/assembler/assembler.ts`, `assemble.ts`)

Two-pass design:

1. **Preprocess** (`pre-process.ts`): strips comments (comment char is CPU-specific — `@` for arm7di, see `getPreprocessOptions`).
2. **Parse**: `program.parse(source)` uses parser combinators (`src/modules/parser-combinators`) to build an AST of `Statement` nodes (Directive / Instruction / Label / SymbolAssignment). Parsers for each construct live in `src/modules/assembler/parsers/`.
3. **Emit**: `Assembler#assemble` walks the AST. Directives populate a `dataSection` (`.data`, `.ascii`, `.string`, `.word`, `.float`, `.zero`, `.equiv`, `.global`). Instructions are dispatched by op-code through `#instructionHandlers` (data-processing, multiply, single-data-transfer, block-data-transfer, branch, SVC, BX) which call the encoder functions from `src/instructions/*` to produce 32-bit words. The `textSection` starts at `VECTOR_TABLE_END = 0x1C` (leaving 0x00–0x1C for the ARM exception vector table). A literal pool is maintained per text section for `ldr rX, =symbol` patterns.
4. **Link**: symbols (labels and `=` assignments) are resolved in a second pass; the assembled bytes are written into the provided `Memory`; `assemble` returns the address of the entry symbol (default `_start`).

`Assembler` is a class that pre-builds its handler tables once; `assemble.ts` also exports a functional `assemble(...)` variant used in some flows. Prefer the class API (as the examples do) when you need to reuse an assembler.

### Instruction encoders (`src/instructions/*`)

Each file exports a function that takes a typed argument object (e.g. `mov({ rd, i, s, operand2 })`) and returns a 32-bit `number` encoded per the ARM32 encoding rules. Grouped by format: `data-processing/` (arithmetic + logical), `branch/` (B, BX — BL is encoded as B with L bit), `single-data-transfer/`, `block-data-transfer/`, `multiply/`, `software-interrupt/`. These encoders are the shared contract between the assembler (which emits machine code) and the unit tests (which bypass the assembler and call encoders directly).

### Parser combinators (`src/modules/parser-combinators`)

Generic library — `Parser<T>` wraps a `ParserFunction<T>` and tracks `{ index, line, column }` in `ParserState`. Combinators (`sequence`, `either`, `many`, `map`, `char`, etc.) live under `parsers/combinators`, `parsers/primary`, and `parsers/utils`. The assembler builds on top of this; do not reach into Node regex or ad-hoc string slicing for assembly syntax — add a parser.

### Testing conventions

- `node:test` + `node:assert`. Spec files are either colocated (`src/modules/cpu/cpu.spec.ts`, `src/instructions/data-processing/data-processing.spec.ts`, `src/modules/assembler/parsers/program.spec.ts`) or placed under `test/<mnemonic>/<mnemonic>.spec.ts`.
- Tests typically construct a fresh `Memory` + `MemoryController` + `CPU`, hand-encode a list of instructions with the encoder functions (not assembly source), write them into memory, and assert register/memory state after `cpu.cycle()`s. Follow this pattern for new CPU tests — it isolates the CPU from the assembler.

## Reference docs

`docs/DDI0027D_7di_ds.pdf` (ARM7DI datasheet) and `docs/elf.pdf` (ELF format). `README.md` has an ARM instruction-encoding cheat sheet, the exception vector table layout, and the BNF grammar the assembler parsers implement.
