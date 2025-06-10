import { map, sequence, many, whitespace } from '../../../parser-combinators';
import { directiveName } from '../directive-name';
import { stringConstant } from '../tokens';

export const asciiDirective = map(sequence(directiveName('ascii'), many(whitespace), stringConstant), (value) => ({
  type: 'Directive',
  name: value[0].value,
  value: value[2].value,
}));
