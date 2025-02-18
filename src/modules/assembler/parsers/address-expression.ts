import { map, sequence, char } from "../../parser-combinators";
import { expression } from "./expressions";

export const addressExpression = map(
  sequence(
    char('='),
    expression
  ),
  value => value[1]
)