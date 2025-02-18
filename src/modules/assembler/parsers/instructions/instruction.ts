import { either } from "../../../parser-combinators";
import { add } from "./add";
import { b } from "./b";
import { bl } from "./bl";
import { bx } from "./bx";
import { cmp } from "./cmp";
import { ldm } from "./ldm";
import { ldr } from "./ldr";
import { mov } from "./mov";
import { mul } from "./mul";
import { pop } from "./pop";
import { push } from "./push";
import { stm } from "./stm";
import { str } from "./str";
import { sub } from "./sub";
import { svc } from "./svc";

export const instruction = either(
  mov,
  b,
  bl,
  bx,
  ldr,
  svc,
  cmp,
  add,
  str,
  stm,
  ldm,
  pop,
  push,
  sub,
  mul
)