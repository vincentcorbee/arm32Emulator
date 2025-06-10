import { Memory } from '../memory/types';

export type Section = {
  type: 'text' | 'data';
  locationCounter: number;
  entries: Array<any>;
  symbols: Set<string>;
  literalPool: Array<{ location: number; name: string; symbolName: string }>;
};

export type SymbolTable = Map<string, { type: string; value: number }>;

export type GlobalSymbols = Set<string>;

export type InstructionHandler = (
  statement: any,
  context: Context,
  pass: 1 | 2 | 3,
  memory: Memory,
) => number | void | boolean;

export type DirectiveHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory) => void | boolean;

export type Handler = InstructionHandler | DirectiveHandler;

export type Context = {
  symbolTable: SymbolTable;
  textSection: Section;
  dataSection: Section;
  globalSymbols: GlobalSymbols;
  currentSection: Section;
  currentSymbols: string[];
};

export type PreProcessOptions = {
  commentIdentifier?: string;
};
