import * as OP_CODES from '../../constants/mnemonics/op-codes'

export type OpCode = typeof OP_CODES[keyof typeof OP_CODES];