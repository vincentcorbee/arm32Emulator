import { map, sequence } from '../../parser-combinators';
import { expression } from './expressions';
import { optionalWhitespace } from './optional-whitespace';
import { equal, symbol } from './tokens';

export const parseSymbolAssignment = map(
  sequence(symbol, optionalWhitespace, equal, optionalWhitespace, expression),
  (value) => ({ type: 'SymbolAssignment', name: value[0].name, value: value[4] }),
);
