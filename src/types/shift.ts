import { ShiftSourceImmediate, ShiftSourceRegister } from './codes/shift-source';
import { ShiftType } from './codes/shift-type';

export type RegisterShift = {
  source: ShiftSourceRegister;
  type: ShiftType;
  register: number;
};

export type ImmediateShift = {
  source: ShiftSourceImmediate;
  type: ShiftType;
  amount: number;
};

export type Shift = RegisterShift | ImmediateShift;
