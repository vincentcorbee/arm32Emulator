import { multiply, MultiplyArgs } from "./multiply";

export type MulArgs = Omit<MultiplyArgs, 'a'>

export const mul = (args: MulArgs): number => multiply({ ...args, a: 0 })