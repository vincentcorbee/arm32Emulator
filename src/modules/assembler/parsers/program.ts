import { map } from "../../parser-combinators";
import { sequence } from "../../parser-combinators/parsers/combinators/sequence";
import { optionalWhitespaceOrNewline } from "./optional-whitespace-or-newline";
import { statements } from "./statements";

export const program = map<any ,any>(
  sequence(
    optionalWhitespaceOrNewline,
    statements
  ),
  value => ({ type: 'Program', body: value[1] })
)