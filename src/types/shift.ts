import { ShiftType } from "./codes/shift-type"

export type RegisterShift = {
  type: ShiftType, register: number
}

export type ImmediateShift = {
  type: ShiftType, amount: number
}

export type Shift = RegisterShift & ImmediateShift