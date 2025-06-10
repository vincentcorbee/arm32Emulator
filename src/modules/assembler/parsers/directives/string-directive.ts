import { many, map, sequence, whitespace } from '../../../parser-combinators';
import { directiveName } from '../directive-name';
import { stringConstant } from '../tokens';

export const stringDirective = map(sequence(directiveName('string'), many(whitespace), stringConstant), (value) => ({
  type: 'Directive',
  name: value[0].value,
  value: `${value[2].value}\n`,
}));
