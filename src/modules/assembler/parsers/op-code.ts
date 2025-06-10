import { OpCodeNameToCode } from "../../../constants/maps";
import { OpCode } from "../../../types/mnemonics/op-codes";
import { map } from "../../parser-combinators";
import { upperOrLower } from "./upper-or-lower";

export const opCode = (opCode: OpCode) => map(
  upperOrLower(opCode),
  () => ({ value: OpCodeNameToCode[opCode], mnemonic: opCode, type: 'OpCode' })
)