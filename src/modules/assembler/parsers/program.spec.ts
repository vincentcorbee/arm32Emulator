import assert from 'node:assert';
import test, { describe } from 'node:test';

import { program } from './program';

describe('program parser', () => {
  test('should fail', () => {
    const result = program.parse('mov r0, #1\nfoo\n');

    assert.equal(result.success, false);
  });

  test('should succeed', () => {
    const result = program.parse('mov r0, #1\nmov r1, #2\n');

    assert.equal(result.success, true);
  });
});
