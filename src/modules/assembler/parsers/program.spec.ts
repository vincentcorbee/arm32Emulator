import test, { describe } from 'node:test';
import assert from 'node:assert';
import { program } from './program';

describe('program', () => {
  test('should fail', () => {
    const result = program.parse('ldrb r3, [r2]\nfoo\n');

    assert.equal(result.success, false);
  });

  test('should succeed', () => {
    const result = program.parse('ldrb r3, [r2]\nmov r0, #1\n');

    assert.equal(result.success, true);
  });
});
