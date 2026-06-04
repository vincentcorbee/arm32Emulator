import { map, sequence, many, whitespace } from '../../../parser-combinators';
import { directiveName } from '../directive-name';
import { expression } from '../expressions';

export const zeroDirective = map(sequence(directiveName('zero'), many(whitespace), expression), (value) => ({
  type: 'Directive',
  name: value[0].value,
  value: value[2],
}));
