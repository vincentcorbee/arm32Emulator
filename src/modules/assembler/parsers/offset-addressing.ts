import { IMMIDATE_OFFSET, REGISTER_OFFSET } from '../../../constants/codes';
import { map, sequence, optional, either } from '../../parser-combinators';
import { ImmediateExpression } from './expressions/immidiate-expression';
import { optionalWhitespace } from './optional-whitespace';
import { register } from './register';
import { shift } from './shift';
import { comma, leftSquareBracket, LSL, exclamationMark, rightSquareBracket } from './tokens';

const registerOffsetPreIndexed = map(
  sequence(
    leftSquareBracket,
    optionalWhitespace,
    register,
    optionalWhitespace,
    optional(map(sequence(comma, optionalWhitespace, register), (value) => value[2])),
    optionalWhitespace,
    optional(
      map(sequence(comma, optionalWhitespace, LSL, optionalWhitespace, ImmediateExpression), (value) => ({
        type: 'LSL',
        value: value[4].value,
      })),
    ),
    optionalWhitespace,
    rightSquareBracket,
    optionalWhitespace,
    optional(exclamationMark),
  ),
  (value) => {
    const rn = value[2].value;
    const offset = value[4] ?? undefined;
    const shift = value[6] ?? undefined;
    const writeBack = value[7];

    return {
      type: 'OffsetAddressing',
      offsetMode: REGISTER_OFFSET,
      rn,
      offset,
      shift,
      writeBack: writeBack !== null ? 1 : 0,
      prePost: 1,
    };
  },
);

const registerOffsetPostIndexed = map(
  sequence(
    leftSquareBracket,
    optionalWhitespace,
    register,
    optionalWhitespace,
    rightSquareBracket,
    optionalWhitespace,
    comma,
    optionalWhitespace,
    register,
    optionalWhitespace,
    shift,
  ),
  (value) => {
    return {
      type: 'OffsetAddressing',
      offsetMode: REGISTER_OFFSET,
      rn: value[2].value,
      offset: {
        ...value[8],
        shift: value[10],
      },
      writeBack: 1,
      prePost: 0,
    };
  },
);

const immidiateOffsetPreIndexed = map(
  sequence(
    leftSquareBracket,
    optionalWhitespace,
    register,
    optionalWhitespace,
    optional(
      map(sequence(comma, optionalWhitespace, ImmediateExpression, optionalWhitespace), (value) => value[2]),
      () => ({
        value: { value: 0, type: 'Number' },
        type: 'ImmediateExpression',
      }),
    ),
    rightSquareBracket,
    optionalWhitespace,
    optional(exclamationMark),
  ),
  (value) => {
    const rn = value[2].value;
    const offset = value[4] || undefined;
    const writeBack = value[7];

    return {
      type: 'OffsetAddressing',
      offsetMode: IMMIDATE_OFFSET,
      rn,
      offset,
      writeBack: writeBack !== null ? 1 : 0,
      prePost: 1,
    };
  },
);

const immidiateOffsetPostIndexed = map(
  sequence(
    leftSquareBracket,
    optionalWhitespace,
    register,
    optionalWhitespace,
    rightSquareBracket,
    optionalWhitespace,
    comma,
    optionalWhitespace,
    ImmediateExpression,
  ),
  (value) => {
    return {
      type: 'OffsetAddressing',
      offsetMode: IMMIDATE_OFFSET,
      rn: value[2].value,
      offset: value[8],
      writeBack: 1,
      prePost: 0,
    };
  },
);

export const offsetAddressing = either(
  immidiateOffsetPostIndexed,
  registerOffsetPostIndexed,
  immidiateOffsetPreIndexed,
  registerOffsetPreIndexed,
);
