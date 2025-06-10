import { many, map, sequence, whitespace } from '../../../parser-combinators';
import { directiveName } from '../directive-name';
import { symbol } from '../tokens';

export const globalDirective = map(sequence(directiveName('global'), many(whitespace), symbol), (value) => ({
  type: 'Directive',
  name: value[0].value,
  value: value[2].name,
}));
