/*
  3.3 Registers
  The processor has a total of 37 registers made up of 31 general 32 bit registers and 6 status registers. At any
  one time 16 general registers (R0 to R15) and one or two status registers are visible to the programmer. The
  visible registers depend on the processor mode. The other registers, known as the banked registers, are
  switched in to support IRQ, FIQ, Supervisor, Abort and Undefined mode processing. Figure 6: Register
  Organisation shows how the registers are arranged, with the banked registers shaded.

  In all modes 16 registers, R0 to R15, are directly accessible. All registers except R15 are general purpose and
  may be used to hold data or address values. Register R15 holds the Program Counter (PC). When R15 is
  read, bits [1:0] are zero and bits [31:2] contain the PC. A seventeenth register (the CPSR - Current Program
  Status Register) is also accessible. It contains condition code flags and the current mode bits and may be
  thought of as an extension to the PC.

  R14 is used as the subroutine link register and receives a copy of R15 when a Branch and Link instruction
  is executed. It may be treated as a general purpose register at all other times. R14_svc, R14_irq, R14_fiq,
  R14_abt and R14_und are used similarly to hold the return values of R15 when interrupts and exceptions
  arise, or when Branch and Link instructions are executed within interrupt or exception routines.
*/

/* General purpose */
export const R0 = 0x00
export const R1 = 0x01
export const R2 = 0x02
export const R3 = 0x03
export const R4 = 0x04
export const R5 = 0x05
export const R6 = 0x06
export const R7 = 0x07
export const R8 = 0x08
export const R9 = 0x09
export const R10 = 0x0a
export const R11 = 0x0b
export const R12 = 0x0c
export const R13 = 0x0d
export const R14 = 0x0e

/* Special purpose */

/* Program Counter */
export const R15 = 0x0f
/* Current Program Status Register */
export const CPSR = 0x10

/* Register aliases */
export const FP = R11
export const IP = R12
export const SP = R13
export const LR = R14
export const PC = R15

/* Supervisor mode */
export const R13_SVC = 0x11
export const R14_SVC = 0x12
export const SPSR_SVC = 0x13

/* Undefined mode */
export const R13_UND = 0x14
export const R14_UND = 0x15
export const SPSR_UND = 0x16

/* Saved Program Status Register */
export const SPSR = 0x17