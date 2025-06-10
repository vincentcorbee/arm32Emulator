import { Parser } from '../../parser';

export const lazy = <T = any>(fn: () => Parser<T>) => new Parser<T>((input, state) => fn().parse(input, state));
