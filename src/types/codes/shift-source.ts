import * as SHIFT_SOURCE_TYPES from '../../constants/codes/shift-source';

export type ShiftSource = (typeof SHIFT_SOURCE_TYPES)[keyof typeof SHIFT_SOURCE_TYPES];
export type ShiftSourceImmediate = (typeof SHIFT_SOURCE_TYPES)['SHIFT_SOURCE_IMMEDIATE'];
export type ShiftSourceRegister = (typeof SHIFT_SOURCE_TYPES)['SHIFT_SOURCE_REGISTER'];
