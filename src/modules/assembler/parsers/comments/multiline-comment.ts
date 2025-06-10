import { map, sequence, many0 } from '../../../parser-combinators';
import { not } from '../not';
import { endMultilineComment, startMultilineComment } from '../tokens';

export const multilineComment = map(
  sequence(startMultilineComment, many0(not(endMultilineComment)), endMultilineComment),
  (value) => ({ type: 'Comment', value: value[1].join('') }),
);
