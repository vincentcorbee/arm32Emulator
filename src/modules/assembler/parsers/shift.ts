import { ShiftTypeNameToCode } from '../../../constants/maps';
import { optional, map, sequence, or } from '../../parser-combinators';
import { ShiftType } from '../../../types/mnemonics/shift-type';
import { immidiateExpression } from './expressions/immidiate-expression';
import { optionalWhitespace } from './optional-whitespace';
import { register } from './register';
import { shiftType } from './shift-type';
import { comma } from './tokens';
import { SHIFT_SOURCE_IMMEDIATE, SHIFT_SOURCE_REGISTER } from '../../../constants/codes';

export const shift = optional(
  map(
    sequence(comma, optionalWhitespace, shiftType, optionalWhitespace, or(immidiateExpression, register)),
    (value) => {
      const shiftSrc = value[4];
      const type = ShiftTypeNameToCode[value[2] as ShiftType];

      if (shiftSrc.type === 'ImmidiateExpression') {
        return {
          source: SHIFT_SOURCE_IMMEDIATE,
          type,
          amount: shiftSrc,
        };
      }

      return {
        source: SHIFT_SOURCE_REGISTER,
        type,
        register: shiftSrc.value,
      };
    },
  ),
);
