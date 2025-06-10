import { ldr, LdrArgs } from './ldr';

export type LdrbArgs = Omit<LdrArgs, 'b'>;

export const ldrb = (args: LdrbArgs) => ldr({ ...args, b: 1 });
