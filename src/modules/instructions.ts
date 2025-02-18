/*
  The Condition Field

  In ARM state, all instructions are conditionally executed according to the state of the
  CPSR condition codes and the instruction’s condition field.
  This field (bits 31:28) determines the circumstances under which an instruction is to be executed. If the state
  of the C, N, Z and V flags fulfils the conditions encoded by the field, the instruction is
  executed, otherwise it is ignored.

  There are sixteen possible conditions, each represented by a two-character suffix that
  can be appended to the instruction’s mnemonic. For example, a Branch (B in assembly
  language) becomes BEQ for "Branch if Equal", which means the Branch will only be
  taken if the Z flag is set.

  In practice, fifteen different conditions may be used: these are listed in Table 4-2:
  Condition code summary.

  The sixteenth (1111) is reserved, and must not be used.

  In the absence of a suffix, the condition field of most instructions is set to "Always" (sufix
  AL). This means the instruction will always be executed regardless of the CPSR
  condition codes.

  Table 4-2: Condition code

  Code Suffix Flags Meaning

  0000 EQ Z set equal
  0001 NE Z clear not equal
  0010 CS C set unsigned higher or same
  0011 CC C clear unsigned lower
  0100 MI N set negative
  0101 PL N clear positive or zero
  0110 VS V set overflow
  0111 VC V clear no overflow
  1000 HI C set and Z clear unsigned higher
  1001 LS C clear or Z set unsigned lower or same
  1010 GE N equals V greater or equal
  1011 LT N not equal to V less than
  1100 GT Z clear AND (N equals V) greater than
  1101 LE Z set OR (N not equal to V) less than or equal
  1110 AL (ignored) always
*/

export const EQ = 0x0; // 0000 EQ Z set equal
export const NE = 0x1; // 0001 NE Z clear not equal
export const CS = 0x2; // 0010 CS C set unsigned higher or same
export const CC = 0x3; // 0011 CC C clear unsigned lower
export const MI = 0x4; // 0100 MI N set negative
export const PL = 0x5; // 0101 PL N clear positive or zero
export const VS = 0x6; // 0110 VS V set overflow
export const VC = 0x7; // 0111 VC V clear no overflow
export const HI = 0x8; // 1000 HI C set and Z clear unsigned higher
export const LS = 0x9; // 1001 LS C clear or Z set unsigned lower or same
export const GE = 0xa; // 1010 GE N equals V greater or equal
export const LT = 0xb; // 1011 LT N not equal to V less than
export const GT = 0xc; // 1100 GT Z clear AND (N equals V) greater than
export const LE = 0xd; // 1101 LE Z set OR (N not equal to V) less than or equal
export const AL = 0xe; // 1110 AL (ignored) always

export const N = 0x80000000
export const Z = 0x40000000
export const C = 0x20000000
export const V = 0x10000000

export const SVC = 0xf
export const LDR = 0x1
export const STR = 0x1
export const B = 0x0
export const BL = 0x1