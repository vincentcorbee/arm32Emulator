import * as SHIFT_TYPES from '../../constants/codes/shift-types';

export type ShiftType = (typeof SHIFT_TYPES)[keyof typeof SHIFT_TYPES];
