import { ShiftTypeNameToCode } from "../../../constants/maps";
import { optional, map, sequence, or } from "../../parser-combinators";
import { ShiftTypes } from "../../types";
import { immidiateExpression } from "./expressions/immidiate-expression";
import { optionalWhitespace } from "./optional-whitespace";
import { register } from "./register";
import { shiftType } from "./shift-type";
import { comma } from "./tokens";

export const shift = optional(
  map(
    sequence(
      comma,
      optionalWhitespace,
      shiftType,
      optionalWhitespace,
      or(
        immidiateExpression,
        register
      )
    ), value => {
      const shiftSrc = value[4]
      const type = ShiftTypeNameToCode[value[2] as ShiftTypes]

      if (shiftSrc.type === 'ImmidiateExpression') {
        return {
          type,
          amount: shiftSrc
        }
      }

      return {
        type,
        register: shiftSrc.value
      }
    }
  )
)