import {
  ADD,
  B,
  BIC,
  BL,
  BX,
  CMP,
  LDM,
  LDR,
  LDRB,
  MOV,
  MUL,
  MVN,
  ORR,
  POP,
  PUSH,
  STM,
  STR,
  STRB,
  SUB,
  SVC,
} from '../../constants/codes';
import { ASCII, DATA, EQUIV, FLOAT, GLOBAL, STRING, TEXT, WORD, ZERO } from '../../constants/mnemonics';
import { b, bx, ldr, mul, str, svc } from '../../instructions';
import { blockDataTransfer } from '../../instructions/block-data-transfer/block-data-transfer';
import { dataProcessing } from '../../instructions/data-processing/data-processing';
import { Memory } from '../memory/types';
import { evalExpression } from './eval-expression';
import { program } from './parsers';
import { preProcess } from './pre-process';
import { toIEEE754SinglePrecision } from './to-ieee754-single-precision';
import { PreProcessOptions } from './pre-process';
import {
  AsciiDirective,
  Context,
  DirectiveHandler,
  DirectiveStatement,
  EquivDirective,
  FloatDirective,
  GlobalDirective,
  GlobalSymbols,
  Handler,
  InstructionHandler,
  InstructionStatement,
  LabelStatement,
  Section,
  Statement,
  SymbolAssignmentStatement,
  SymbolTable,
  WordDirective,
  ZeroDirective,
} from './types';

export type CPUType = 'arm7di';

export type AssemblerArgs = {
  e?: string;
  mcpu?: CPUType;
};

export const VECTOR_TABLE_END = 0x0000001c;

export const getPreprocessOptions = (cpuType: CPUType): PreProcessOptions => {
  switch (cpuType) {
    case 'arm7di':
      return {
        commentIdentifier: '@',
      };
    default:
      throw Error('Unknown CPU type');
  }
};

export class Assembler {
  #instructionHandlers: Record<number, InstructionHandler>;
  #directiveHandlers: Record<string, DirectiveHandler>;
  #singleDataTransferHandlers: Record<number, InstructionHandler>;

  constructor() {
    this.#singleDataTransferHandlers = {
      [LDR]: this.#ldrHandler,
      [LDRB]: this.#ldrHandler,
      [STR]: this.#strHandler,
      [STRB]: this.#strHandler,
    };

    this.#instructionHandlers = {
      [MOV]: this.#dataProcessingHandler,
      [MVN]: this.#dataProcessingHandler,
      [SUB]: this.#dataProcessingHandler,
      [ADD]: this.#dataProcessingHandler,
      [CMP]: this.#dataProcessingHandler,
      [ORR]: this.#dataProcessingHandler,
      [BIC]: this.#dataProcessingHandler,
      [MUL]: this.#multiplyHandler,
      [LDR]: this.#singleDataTransferHandler,
      [LDRB]: this.#singleDataTransferHandler,
      [STR]: this.#singleDataTransferHandler,
      [STRB]: this.#singleDataTransferHandler,
      [PUSH]: this.#blockDataTransferHandler,
      [STM]: this.#blockDataTransferHandler,
      [POP]: this.#blockDataTransferHandler,
      [LDM]: this.#blockDataTransferHandler,
      [B]: this.#branchHandler,
      [BL]: this.#branchHandler,
      [BX]: this.#branchExchangeHandler,
      [SVC]: this.#softWareInterruptHandler,
    };

    this.#directiveHandlers = {
      [ASCII]: this.#asciiHandler as DirectiveHandler,
      [STRING]: this.#stringHandler as DirectiveHandler,
      [WORD]: this.#wordHandler as DirectiveHandler,
      [ZERO]: this.#zeroHandler as DirectiveHandler,
      [DATA]: this.#dataHandler,
      [TEXT]: this.#textHandler,
      [GLOBAL]: this.#globalHandler as DirectiveHandler,
      [EQUIV]: this.#equivHandler as DirectiveHandler,
      [FLOAT]: this.#floatHandler as DirectiveHandler,
    };
  }

  assemble(source: string, memory: Memory, args?: AssemblerArgs): number {
    const { e = '_start', mcpu = 'arm7di' } = args ?? {};
    const startAddress = VECTOR_TABLE_END;
    const preProcessOptions = getPreprocessOptions(mcpu);
    const preProcessResult = preProcess(source, preProcessOptions);

    if (!preProcessResult.success) {
      throw Error(`Preprocess failed at line ${preProcessResult.position.line}:${preProcessResult.position.column} — ${preProcessResult.message}`);
    }

    const { value } = preProcessResult;
    const result = program.parse(value);

    if (!result.success) {
      throw Error(`Parse failed at line ${result.position.line}:${result.position.column} — ${result.message}`);
    } else {
      const body = result.value.body as Statement[];
      const globalSymbols: GlobalSymbols = new Set();
      const symbolTable: SymbolTable = new Map();
      const textSection: Section = {
        type: 'text',
        locationCounter: startAddress,
        entries: [],
        symbols: new Set(),
        literalPool: [],
      };
      const dataSection: Section = {
        type: 'data',
        locationCounter: 0,
        entries: [],
        symbols: new Set(),
        literalPool: [],
      };
      const context: Context = {
        symbolTable,
        textSection,
        dataSection,
        globalSymbols,
        currentSection: textSection,
        currentSymbols: [],
      };

      /* First pass */
      body
        .filter((statement) => this.#handler(statement, context, 1, memory))
        /* Second pass */
        .forEach((statement) => {
          switch (statement.type) {
            case 'SymbolAssignment': {
              return this.#symbolAssignmentHandler(statement, context, 2);
            }
            case 'Directive': {
              switch (statement.name) {
                case EQUIV: {
                  return this.#equivHandler(statement, context, 2);
                }
              }
            }
          }
        });

      this.#relocateDataSymbols(context);

      this.#updateLiteralPool(context, memory);

      /* Third pass */

      context.currentSection = textSection;

      textSection.entries.forEach((statement) => {
        switch (statement.type) {
          case 'Instruction': {
            this.#instructionHandler(statement, context, 3, memory);

            break;
          }
          case 'Directive': {
            this.#directiveHandler(statement, context, 3, memory);

            break;
          }
        }
      });

      context.currentSection = dataSection;

      dataSection.entries.forEach((statement) => {
        switch (statement.type) {
          case 'Directive': {
            this.#directiveHandler(statement, context, 3, memory);

            break;
          }
        }
      });

      if (!globalSymbols.has(e))
        console.warn(
          `Warning: cannot find entry symbol ${e}, defaulting to 0x${startAddress.toString(16).padStart(8, '0')}`,
        );

      return symbolTable.get(e)?.value || 0;
    }
  }

  #relocateDataSymbols(context: Context) {
    const { dataSection, textSection, symbolTable } = context;
    const offsetDataSection = textSection.locationCounter + textSection.literalPool.length * 4;

    dataSection.symbols.forEach((name) => (symbolTable.get(name)!.value += offsetDataSection));
  }

  #updateLiteralPool(context: Context, memory: Memory): void {
    const { textSection, symbolTable } = context;

    textSection.literalPool.forEach(({ name, symbolName }) => {
      const location = textSection.locationCounter;

      symbolTable.get(symbolName)!.value = location;

      memory.writeUint32(location, symbolTable.get(name)!.value);

      textSection.locationCounter += 4;
    });
  }

  #updateLabels(context: Context): void {
    const { symbolTable, currentSection, currentSymbols } = context;

    currentSymbols.forEach((label) => (symbolTable.get(label)!.value = currentSection.locationCounter));
    context.currentSymbols = [];
  }

  #updateSymbolTable(name: string, value: any, context: Context): void {
    const { symbolTable } = context;
    const symbolValue = symbolTable.get(name)!.value;

    symbolTable.get(name)!.value = evalExpression(value, symbolTable, symbolValue);
  }

  #addToLiteralPool(name: string, context: Context): string {
    const { currentSection, symbolTable } = context;
    const existing = currentSection.literalPool.find((entry) => entry.name === name);

    if (existing) return existing.symbolName;

    const symbolName = `${name}_LITERAL`;

    currentSection.literalPool.push({ location: 0, name, symbolName });
    currentSection.symbols.add(symbolName);

    symbolTable.set(symbolName, { type: 'literal', value: 0 });

    return symbolName;
  }

  #handler: Handler = (statement, context, pass, memory) => {
    switch (statement.type) {
      case 'Directive':
        return this.#directiveHandler(statement, context, pass, memory);
      case 'Instruction':
        return this.#instructionHandler(statement, context, pass, memory);
      case 'Label':
        return this.#labelHandler(statement, context, pass);
      case 'SymbolAssignment':
        return this.#symbolAssignmentHandler(statement, context, pass);
      default:
        return false;
    }
  };

  #instructionHandler: InstructionHandler = (statement, context, pass, memory) => {
    const { opCode, location } = statement;
    const handler = this.#instructionHandlers[opCode];

    if (!handler) throw Error('Bad instruction');

    if (pass === 1) {
      const { currentSection } = context;

      if (currentSection.type !== 'text') throw Error('Instruction outside of text section');

      const { entries, locationCounter } = currentSection;

      this.#updateLabels(context);

      statement.location = locationCounter;
      currentSection.locationCounter += 4;

      entries.push(statement);

      if (opCode === LDR || opCode === LDRB) handler(statement, context, pass, memory);

      return false;
    }

    const instruction = handler(statement, context, pass, memory);

    if (typeof instruction === 'number' && typeof location === 'number') memory.writeUint32(location, instruction);
  };

  #directiveHandler: DirectiveHandler = (statement, context, pass, memory) => {
    const handler = this.#directiveHandlers[statement.name];

    if (!handler) throw Error('Bad directive');

    return handler(statement, context, pass, memory);
  };

  #dataProcessingHandler: InstructionHandler = (statement, context): number => {
    const { rd, rn, i, s, cond, operand2, opCode, location = 0 } = statement;
    const { symbolTable } = context;

    const value =
      operand2.type === 'ImmediateExpression' ? evalExpression(operand2, symbolTable, location) : operand2.value;
    const shift = operand2.shift?.amount
      ? { ...operand2.shift, amount: evalExpression(operand2.shift.amount, symbolTable, location) }
      : operand2.shift;

    if (opCode === MOV && value < 0) {
      const resolvedOperand2 = { ...operand2, value: -value - 1, shift };

      return dataProcessing({ rd, rn, i, s, cond, operand2: resolvedOperand2, opCode: MVN });
    }

    return dataProcessing({ rd, rn, i, s, cond, operand2: { ...operand2, value, shift }, opCode });
  };

  #branchHandler: InstructionHandler = (statement, context): number => {
    const { offset: offsetOrValue, cond, l, location = 0 } = statement;
    const { symbolTable } = context;

    let offset;

    if (offsetOrValue.type === 'Label') {
      const { name } = offsetOrValue;

      if (!symbolTable.has(name)) throw Error(`Label ${name} not found`);

      const address = symbolTable.get(name)!.value;
      const currentAddress = location + 8;

      offset = address - currentAddress;
    } else {
      offset = offsetOrValue.value;
    }

    return b({ offset, cond, l });
  };

  #branchExchangeHandler: InstructionHandler = (statement): number => {
    const { rn, cond } = statement;

    return bx({ rn, cond });
  };

  #multiplyHandler: InstructionHandler = (statement): number => {
    const { rd, rn, rs, rm } = statement;

    return mul({ rd, rn, rs, rm });
  };

  #softWareInterruptHandler: InstructionHandler = (statement, context): number => {
    const { comment, location = 0 } = statement;
    const { symbolTable } = context;

    return svc({ comment: evalExpression(comment, symbolTable, location) });
  };

  #singleDataTransferHandler: InstructionHandler = (statement, context, pass, memory) => {
    const { opCode } = statement;

    return this.#singleDataTransferHandlers[opCode](statement, context, pass, memory);
  };

  #blockDataTransferHandler: InstructionHandler = (statement): number => {
    const { cond, rn, registerList, p, u, s, w, l } = statement;

    return blockDataTransfer({ cond, rn, registerList, p, u, s, w, l });
  };

  #ldrHandler: InstructionHandler = (statement, context, pass): number | boolean => {
    const { rd, rn, byteWord, offset, location = 0 } = statement;
    const { symbolTable } = context;

    if (pass === 1) {
      if (offset?.type === 'LabelExpression') {
        statement.literalSymbol = this.#addToLiteralPool(offset.value.name, context);
      }

      return false;
    }

    if (offset?.type === 'LabelExpression') {
      const address = symbolTable.get(statement.literalSymbol!)!.value;
      const currentAddress = location + 8;
      const delta = address - currentAddress;
      const upDown = delta > 1 ? 1 : 0;

      return ldr({
        rd,
        rn,
        i: 1,
        offset: { type: 'ImmediateExpression', value: Math.abs(delta) },
        u: upDown,
        b: byteWord,
      });
    }

    const { writeBack, prePost, i } = statement;
    const resolvedOffset =
      offset.type === 'ImmediateExpression'
        ? { ...offset, value: evalExpression(offset, symbolTable, location) }
        : offset.shift?.amount
          ? { ...offset, shift: { ...offset.shift, amount: evalExpression(offset.shift.amount, symbolTable, location) } }
          : offset;

    return ldr({ i, rd, rn, offset: resolvedOffset, b: byteWord, w: writeBack, p: prePost });
  };

  #strHandler: InstructionHandler = (statement, context): number => {
    const { opCode, rd, rn, offset, writeBack, prePost, i, location = 0 } = statement;
    const { symbolTable } = context;
    const b = opCode === STRB ? 1 : 0;
    const resolvedOffset =
      offset.type === 'ImmediateExpression'
        ? { ...offset, value: evalExpression(offset, symbolTable, location) }
        : offset.shift?.amount
          ? { ...offset, shift: { ...offset.shift, amount: evalExpression(offset.shift.amount, symbolTable, location) } }
          : offset;

    return str({ i, rd, rn, offset: resolvedOffset, b, w: writeBack, p: prePost });
  };

  /* Directive handlers */

  #asciiHandler = (
    statement: AsciiDirective,
    context: Context,
    pass: 1 | 2 | 3,
    memory: Memory,
  ): void | boolean => {
    const { currentSection, textSection } = context;
    const { type } = currentSection;
    const { value } = statement;

    if (pass === 1) {
      const { locationCounter, entries } = currentSection;

      this.#updateLabels(context);

      statement.location = locationCounter;
      currentSection.locationCounter += value.length;
      entries.push(statement);

      return false;
    }

    const { location = 0 } = statement;
    const address = location + (type === 'data' ? textSection.locationCounter : 0);

    for (let i = 0, l = value.length; i < l; i++) {
      memory.writeUint8(address + i, value.charCodeAt(i));
    }
  };

  #stringHandler = (
    statement: AsciiDirective,
    context: Context,
    pass: 1 | 2 | 3,
    memory: Memory,
  ): void | boolean => {
    if (pass === 1) statement.value = `${statement.value}\0`;

    return this.#asciiHandler(statement, context, pass, memory);
  };

  #wordHandler = (
    statement: WordDirective,
    context: Context,
    pass: 1 | 2 | 3,
    memory: Memory,
  ): void | boolean => {
    const { currentSection, textSection, symbolTable } = context;
    const { type } = currentSection;
    const { value } = statement;

    if (pass === 1) {
      const { entries, locationCounter } = currentSection;

      this.#updateLabels(context);

      statement.location = locationCounter;
      currentSection.locationCounter += value.length * 4;
      entries.push(statement);

      return false;
    }

    const { location = 0 } = statement;
    const address = location + (type === 'data' ? textSection.locationCounter : 0);

    for (let i = 0; i < value.length; i++) {
      memory.writeUint32(address + i * 4, evalExpression(value[i], symbolTable, address));
    }
  };

  #zeroHandler = (
    statement: ZeroDirective,
    context: Context,
    pass: 1 | 2 | 3,
    memory: Memory,
  ): void | boolean => {
    const { currentSection, textSection, symbolTable } = context;
    const { type } = currentSection;

    if (pass === 1) {
      const { entries, locationCounter } = currentSection;
      const size = evalExpression(statement.value, symbolTable, locationCounter);

      this.#updateLabels(context);

      statement.location = locationCounter;
      statement.size = size;
      currentSection.locationCounter += size;
      entries.push(statement);

      return false;
    }

    const { location = 0, size = 0 } = statement;
    const address = location + (type === 'data' ? textSection.locationCounter : 0);

    for (let i = 0; i < size; i++) {
      memory.writeUint8(address + i, 0);
    }
  };

  #dataHandler = (_statement: DirectiveStatement, context: Context): boolean => {
    context.currentSection = context.dataSection;

    return false;
  };

  #textHandler = (_statement: DirectiveStatement, context: Context): boolean => {
    context.currentSection = context.textSection;

    return false;
  };

  #globalHandler = (statement: GlobalDirective, context: Context): boolean => {
    context.globalSymbols.add(statement.value);

    return false;
  };

  #equivHandler = (statement: EquivDirective, context: Context, pass: 1 | 2 | 3): boolean => {
    const { symbol, value } = statement;

    if (pass === 1) {
      const { symbolTable, currentSection } = context;

      if (symbolTable.has(symbol)) throw Error(`Symbol ${symbol} already defined`);

      symbolTable.set(symbol, { type: 'constant', value: currentSection.locationCounter });

      return true;
    }

    if (pass === 2) {
      this.#updateSymbolTable(symbol, value, context);

      return false;
    }

    return false;
  };

  #floatHandler = (
    statement: FloatDirective,
    context: Context,
    pass: 1 | 2 | 3,
    memory: Memory,
  ): void | boolean => {
    const { currentSection, textSection } = context;
    const { type } = currentSection;
    const { value } = statement;

    if (pass === 1) {
      const { locationCounter, entries } = currentSection;

      this.#updateLabels(context);

      statement.location = locationCounter;
      currentSection.locationCounter += 4;
      entries.push(statement);

      return false;
    }

    const { location = 0 } = statement;
    const address = location + (type === 'data' ? textSection.locationCounter : 0);

    memory.writeUint32(address, toIEEE754SinglePrecision(value));
  };

  #labelHandler = (statement: LabelStatement, context: Context, pass: 1 | 2 | 3): boolean => {
    if (pass === 1) {
      const { name } = statement;
      const { symbolTable, currentSection, currentSymbols } = context;

      if (!symbolTable.has(name)) {
        currentSymbols.push(name);

        symbolTable.set(name, { type: 'label', value: 0 });

        currentSection.symbols.add(name);
      }
    }

    return false;
  };

  #symbolAssignmentHandler = (statement: SymbolAssignmentStatement, context: Context, pass: 1 | 2 | 3): boolean => {
    const { name, value } = statement;

    if (pass === 1) {
      const { symbolTable, currentSection } = context;

      symbolTable.set(name, { type: 'constant', value: currentSection.locationCounter });

      return true;
    }

    if (pass === 2) {
      this.#updateSymbolTable(name, value, context);

      return false;
    }

    return false;
  };
}
