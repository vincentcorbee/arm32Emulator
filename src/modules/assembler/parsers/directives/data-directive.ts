import { map } from '../../../parser-combinators';
import { directiveName } from '../directive-name';

export const dataDirective = map(directiveName('data'), (value) => ({ type: 'Directive', name: value.value }));
