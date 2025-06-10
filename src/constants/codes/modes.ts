/*
  Program status registers
  31 30 29 28 27 . . . 8 7 6 5 4  3  2  1  0
  N  Z  C  V  .  . . . . I F . M4 M3 M2 M1 M0

  N Negative / less then
  Z Zero
  C Carry / borrow / extend
  V Overflow
  I IRQ disable
  F FIQ disable
  M4..M0 Mode bits

  M[4:0]  Mode          Accessible Registers
  10000   User          PC, R14..R0                     CPSR
  10001   FIQ           PC, R14_fiq..R8_fiq, R7..R0     CPSR, SPSR_fiq
  10010   IRQ           PC, R14_irq..R13_irq, R12..R0   CPSR, SPSR_irq
  10011   Supervisor    PC, R14_svc..R13_svc, R12..R0   CPSR, SPSR_svc
  10111   Abort         PC, R14_abt..R13_abt, R12..R0   CPSR, SPSR_abt
  11011   Undefined     PC, R14_und..R13_und, R12..R0   CPSR, SPSR_und
*/

export const M = 0x1f

export const USER = 0x10
export const IQ = 0x11
export const IRQ = 0x12
export const SUPERVISOR = 0x13
export const ABORT = 0x17
export const UND = 0x1b

export const REGISTER_OFFSET = 0x0
export const IMMIDATE_OFFSET = 0x1