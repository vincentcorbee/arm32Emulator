import { map, sequence, whitespace } from '../../../parser-combinators';
import { directiveName } from '../directive-name';
import { expression } from '../expressions';
import { optionalWhitespace } from '../optional-whitespace';
import { comma, symbol } from '../tokens';

export const equivDirective = map(
  sequence(directiveName('equiv'), whitespace, symbol, optionalWhitespace, comma, optionalWhitespace, expression),
  (value) => ({
    type: 'Directive',
    name: value[0].value,
    symbol: value[2].name,
    value: value[6],
  }),
);
