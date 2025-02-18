import { str, StrArgs } from "./str";

export type StrbArgs = Omit<StrArgs, 'b'>

export const strb = (args: StrbArgs) => str({ ...args, b: 1 });