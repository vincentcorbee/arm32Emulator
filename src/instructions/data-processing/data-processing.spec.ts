import assert from 'node:assert';
import test, { describe } from 'node:test';

import { dataProcessing } from './data-processing';
import { AL, ASR, LSL, LSR, MOV, R1, ROR, SHIFT_SOURCE_IMMEDIATE, SHIFT_SOURCE_REGISTER } from '../../constants/codes';
describe('dataProcessing', () => {
  test('should set the correct bits for immedidate value', () => {
    const instruction = dataProcessing({
      operand2: { value: 2, type: 'ImmediateExpression' },
      opCode: MOV,
      cond: AL,
      i: 1,
    });

    assert.equal(instruction, 0b11100011101000000000000000000010);
  });

  test('should set the correct bits for a rotated immedidate value', () => {
    const instruction = dataProcessing({
      operand2: { value: 2, type: 'ImmediateExpression', rotate: 3 },
      opCode: MOV,
      cond: AL,
      i: 1,
    });

    assert.equal(instruction, 0b11100011101000000000001100000010);
  });

  test('should set the correct bits for register', () => {
    const instruction = dataProcessing({
      operand2: { value: R1, type: 'Register' },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    assert.equal(instruction, 0b11100001101000000000000000000001);
  });

  test('should set the correct bits for shifted register by register', () => {
    const lsl = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_REGISTER,
          type: LSL,
          register: R1,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    const lsr = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_REGISTER,
          type: LSR,
          register: R1,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    const asr = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_REGISTER,
          type: ASR,
          register: R1,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    const ror = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_REGISTER,
          type: ROR,
          register: R1,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    assert.equal(lsl, 0b11100001101000000000000100010001);
    assert.equal(lsr, 0b11100001101000000000000100110001);
    assert.equal(asr, 0b11100001101000000000000101010001);
    assert.equal(ror, 0b11100001101000000000000101110001);
  });

  test('should set the correct bits for shifted register by immediate value', () => {
    const lsl = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_IMMEDIATE,
          type: LSL,
          amount: 3,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    const lsr = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_IMMEDIATE,
          type: LSR,
          amount: 3,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    const asr = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_IMMEDIATE,
          type: ASR,
          amount: 3,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    const ror = dataProcessing({
      operand2: {
        value: R1,
        type: 'Register',
        shift: {
          source: SHIFT_SOURCE_IMMEDIATE,
          type: ROR,
          amount: 3,
        },
      },
      opCode: MOV,
      cond: AL,
      i: 0,
    });

    assert.equal(lsl, 0b11100001101000000000000110000001);
    assert.equal(lsr, 0b11100001101000000000000110100001);
    assert.equal(asr, 0b11100001101000000000000111000001);
    assert.equal(ror, 0b11100001101000000000000111100001);
  });
});
