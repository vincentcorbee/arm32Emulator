import { OpCodeNameToCode } from "../../../constants/maps";
import { map } from "../../parser-combinators";
import { OpCodes } from "../../cpu/types";
import { upperOrLower } from "./upper-or-lower";

export const opCode = (opCode: OpCodes) => map(
  upperOrLower(opCode),
  () => ({ value: OpCodeNameToCode[opCode], mnemonic: opCode, type: 'OpCode' })
)