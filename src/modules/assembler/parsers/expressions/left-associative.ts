import { many0, map, Parser } from "../../../parser-combinators";
import { sequence } from "../../../parser-combinators/parsers/combinators/sequence";
import { optionalWhitespace } from "../optional-whitespace";

export const leftAssociative = <T>(parser: Parser<T>, operatorParser: Parser<string>, nodeCreator: any) =>
  map(
    sequence(
      parser,
      many0(
        map(
          sequence(optionalWhitespace, operatorParser, optionalWhitespace, parser),
           value => [value[1], value[3]]
        )
      )
    ),
    ([first, rest]) => rest.reduce((acc: any, [operator, operand]: any) => nodeCreator([acc, operator, operand]), first)
  );