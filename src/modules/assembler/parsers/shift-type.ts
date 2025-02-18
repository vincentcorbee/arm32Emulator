
import { either } from "../../parser-combinators";
import { ASR, LSL, LSR, ROR } from "./tokens";

export const shiftType = either(
  LSL,
  LSR,
  ASR,
  ROR
)