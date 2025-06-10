import * as REGISTERS from '../../constants/codes/registers';

export type Register = (typeof REGISTERS)[keyof typeof REGISTERS];
