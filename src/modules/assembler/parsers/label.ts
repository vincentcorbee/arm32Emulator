import { map, sequence } from "../../parser-combinators";
import { period, symbol } from "./tokens";

export const label = map(
  sequence(
    symbol,
    period
  ), value =>
  ({ type: 'Label', name: value[0].name})
)