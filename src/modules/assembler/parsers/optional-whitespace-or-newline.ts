import { optional, or, whitespace } from '../../parser-combinators';
import { newline } from '../../parser-combinators/parsers/primary/newline';

export const optionalWhitespaceOrNewline = optional(or(whitespace, newline));
