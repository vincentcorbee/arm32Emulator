import { map } from "../../../parser-combinators";
import { createNode } from "../mappers";
import { symbol } from "../tokens";

export const labelExpression = map(
  symbol,
  createNode('LabelExpression')
)