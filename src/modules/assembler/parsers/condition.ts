import { ConditionNameToCode } from '../../../constants/maps';
import { AL, CC, CS, EQ, GE, GT, HI, LE, LS, LT, MI, NE, PL, VC, VS } from '../../../constants/mnemonics';
import { Condition } from '../../../types/mnemonics/conditions';
import { either, map, optional } from '../../parser-combinators';
import { createNode } from './mappers';
import { upperOrLower } from './upper-or-lower';

export const condition = map(
  map(
    optional(
      either(
        upperOrLower(EQ),
        upperOrLower(NE),
        upperOrLower(CS),
        upperOrLower(CC),
        upperOrLower(MI),
        upperOrLower(PL),
        upperOrLower(VS),
        upperOrLower(VC),
        upperOrLower(HI),
        upperOrLower(LS),
        upperOrLower(GE),
        upperOrLower(LT),
        upperOrLower(GT),
        upperOrLower(LE),
        upperOrLower(AL),
      ),
      AL,
    ),
    (code) => ConditionNameToCode[code as Condition],
  ),
  createNode('Condition'),
);
