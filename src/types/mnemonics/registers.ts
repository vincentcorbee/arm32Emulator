import * as REGISTERS from '../../constants/mnemonics/registers';

export type Register = (typeof REGISTERS)[keyof typeof REGISTERS];