import { Memory } from '../memory/types';

export type ExpressionNode = { type: string; [key: string]: any };

export type AsciiDirective = {
  type: 'Directive';
  name: 'ASCII' | 'STRING';
  value: string;
  location?: number;
};

export type WordDirective = {
  type: 'Directive';
  name: 'WORD';
  value: ExpressionNode[];
  location?: number;
};

export type ZeroDirective = {
  type: 'Directive';
  name: 'ZERO';
  value: ExpressionNode;
  location?: number;
  size?: number;
};

export type FloatDirective = {
  type: 'Directive';
  name: 'FLOAT';
  value: number;
  location?: number;
};

export type SectionDirective = {
  type: 'Directive';
  name: 'TEXT' | 'DATA';
};

export type GlobalDirective = {
  type: 'Directive';
  name: 'GLOBAL';
  value: string;
};

export type EquivDirective = {
  type: 'Directive';
  name: 'EQUIV';
  symbol: string;
  value: ExpressionNode;
};

export type DirectiveStatement =
  | AsciiDirective
  | WordDirective
  | ZeroDirective
  | FloatDirective
  | SectionDirective
  | GlobalDirective
  | EquivDirective;

export type InstructionStatement = {
  type: 'Instruction';
  opCode: number;
  mnemonic?: string;
  location?: number;
  literalSymbol?: string;
  [key: string]: any;
};

export type LabelStatement = {
  type: 'Label';
  name: string;
};

export type SymbolAssignmentStatement = {
  type: 'SymbolAssignment';
  name: string;
  value: ExpressionNode;
};

export type Statement = DirectiveStatement | InstructionStatement | LabelStatement | SymbolAssignmentStatement;

export type Section = {
  type: 'text' | 'data';
  locationCounter: number;
  entries: Statement[];
  symbols: Set<string>;
  literalPool: Array<{ location: number; name: string; symbolName: string }>;
};

export type SymbolTable = Map<string, { type: string; value: number }>;

export type GlobalSymbols = Set<string>;

export type InstructionHandler = (
  statement: InstructionStatement,
  context: Context,
  pass: 1 | 2 | 3,
  memory: Memory,
) => number | void | boolean;

export type DirectiveHandler = (
  statement: DirectiveStatement,
  context: Context,
  pass: 1 | 2 | 3,
  memory: Memory,
) => void | boolean;

export type Handler = (
  statement: Statement,
  context: Context,
  pass: 1 | 2 | 3,
  memory: Memory,
) => number | void | boolean;

export type Context = {
  symbolTable: SymbolTable;
  textSection: Section;
  dataSection: Section;
  globalSymbols: GlobalSymbols;
  currentSection: Section;
  currentSymbols: string[];
};

