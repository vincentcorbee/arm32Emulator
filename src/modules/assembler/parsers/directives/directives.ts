import { either } from "../../../parser-combinators";
import { asciiDirective } from "./ascii-directive";
import { dataDirective } from "./data-directive";
import { equivDirective } from "./equiv-directive";
import { floatDirective } from "./float-directive";
import { globalDirective } from "./global-directive";
import { stringDirective } from "./string-directive";
import { textDirective } from "./text-directive";
import { wordDirective } from "./word-directive";
import { zeroDirective } from "./zero-directive";

export const directive = either(
  dataDirective,
  asciiDirective,
  textDirective,
  stringDirective,
  globalDirective,
  equivDirective,
  zeroDirective,
  wordDirective,
  floatDirective
)