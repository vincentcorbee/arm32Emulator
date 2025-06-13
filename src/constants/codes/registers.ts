/* General purpose */
export const R0 = 0x00;
export const R1 = 0x01;
export const R2 = 0x02;
export const R3 = 0x03;
export const R4 = 0x04;
export const R5 = 0x05;
export const R6 = 0x06;
export const R7 = 0x07;
export const R8 = 0x08;
export const R9 = 0x09;
export const R10 = 0x0a;
export const R11 = 0x0b;
export const R12 = 0x0c;
export const R13 = 0x0d;
export const R14 = 0x0e;

/* Special purpose */

/* Program Counter */
export const R15 = 0x0f;
/* Current Program Status Register */
export const CPSR = 0x10;

/* Register aliases */
export const FP = R11;
export const IP = R12;
export const SP = R13;
export const LR = R14;
export const PC = R15;

/* Supervisor mode */
export const R13_SVC = 0x11;
export const R14_SVC = 0x12;
export const SPSR_SVC = 0x13;

/* Undefined mode */
export const R13_UND = 0x14;
export const R14_UND = 0x15;
export const SPSR_UND = 0x16;

/* Saved Program Status Register */
export const SPSR = 0x17;
