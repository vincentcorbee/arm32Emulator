import { Parser } from "../../parser";
import { either } from "./either";

export const or = <A = string, B = string, U = A | B>(parserA: Parser<A>, parserB: Parser<B>) => either<U>(parserA, parserB)