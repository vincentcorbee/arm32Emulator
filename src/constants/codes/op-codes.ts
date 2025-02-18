/* These are the op codes for the data processing intructions */

export const AND = 0x0;    // 0000 = AND - Rd:= Op1 AND Op2
export const SUB = 0x2;    // 0010 = SUB - Rd:= Op1 - Op2
export const RSB = 0x3;    // 0011 = RSB - Rd:= Op2 - Op1
export const ADD = 0x4;    // 0100 = ADD - Rd:= Op1 + Op2
export const ADC = 0x5;    // 0101 = ADC - Rd:= Op1 + Op2 + C
export const SBC = 0x6;    // 0110 = SBC - Rd:= Op1 - Op2 + C
export const RSC = 0x7;    // 0111 = RSC - Rd:= Op2 - Op1 + C
export const TST = 0x8;    // 1000 = TST - set condition codes on Op1 AND Op2
export const TEQ = 0x9;    // 1001 = TEQ - set condition codes on Op1 EOR Op2
export const CMP = 0xa;    // 1010 = CMP - set condition codes on Op1 - Op2
export const CMN = 0xb;    // 1011 = CMN - set condition codes on Op1 + Op2
export const ORR = 0xc;    // 1100 = ORR - Rd:= Op1 OR Op2
export const MOV = 0xd;    // 1101 = MOV - Rd:= Op2
export const BIC = 0xe;    // 1110 = BIC - Rd:= Op1 AND NOT Op2
export const MVN = 0xf;    // 1111 = MVN - Rd:= NOT Op2

/* These op codes are for internal use only */

export const B = 0x10;
export const BL = 0x11;
export const SVC = 0x12;
export const LDR = 0x13;
export const LDRB = 0x14;
export const STR = 0x15;
export const STRB = 0x16;
export const STM = 0x17;
export const LDM = 0x18;
export const BX = 0x19;
export const PUSH = 0x1a;
export const POP = 0x1b;
export const MUL = 0x1c;