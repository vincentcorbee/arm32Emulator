import { chain, char, many, map, regexp, sequence, string } from '../../parser-combinators';
import { mapJoin } from './map-join';
import { upperOrLower } from './upper-or-lower';

export const LSL = upperOrLower('LSL');
export const LSR = upperOrLower('LSR');
export const ASR = upperOrLower('ASR');
export const ROR = upperOrLower('ROR');
export const T = upperOrLower('T');
export const B = upperOrLower('B');
export const S = upperOrLower('S');
export const dot = char('.');
export const semi = char(';');
export const period = char(':');
export const equal = char('=');
export const exclamationMark = char('!');
export const xor = char('^');
export const and = char('&');
export const or = char('|');
export const not = char('~');
export const shiftLeft = char('<<');
export const shiftRight = char('>>');
export const comma = char(',');
export const plus = char('+');
export const minus = char('-');
export const mul = char('*');
export const div = char('/');
export const mod = char('%');
export const pound = char('#');
export const doubleQuote = char('"');
export const singleQuote = char("'");
export const hexadecimalPrefix = upperOrLower('0x');
export const binaryPrefix = upperOrLower('0b');
export const leftSquareBracket = char('[');
export const rightSquareBracket = char(']');
export const leftCurlyBrace = char('{');
export const rightCurlyBrace = char('}');
export const leftParen = char('(');
export const rightParen = char(')');
export const decimalDigit = regexp(/[0-9]/);
export const hexDigit = regexp(/[0-9A-Fa-f]/);
export const binaryDigit = regexp(/[01]/);
export const identifier = regexp(/[a-zA-Z_.][a-zA-Z0-9_$]*/);
export const startMultilineComment = string('/*');
export const endMultilineComment = string('*/');
export const symbol = map(identifier, (value) => ({ type: 'Label', name: value }));
export const decimal = map(mapJoin(many(decimalDigit)), (value) => parseInt(value, 10));
export const hexadecimal = map(
  chain(hexadecimalPrefix, () => mapJoin(many(hexDigit))),
  (value) => parseInt(value, 16),
);
export const binary = map(
  chain(binaryPrefix, () => mapJoin(many(binaryDigit))),
  (value) => parseInt(value, 2),
);
export const characterConstant = map(sequence(singleQuote, regexp(/[^']/), singleQuote), (value) => ({
  type: 'CharacterConstant',
  value: value[1].charCodeAt(0),
}));
export const stringConstant = map(sequence(doubleQuote, regexp(/[^"]*/), doubleQuote), (value) => ({
  type: 'StringConstant',
  value: value[1],
}));
