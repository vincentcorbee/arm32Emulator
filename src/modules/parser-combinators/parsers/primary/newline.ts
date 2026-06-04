import { Parser } from '../../parser';
import { char } from './char';

export const newline = new Parser<string>((input, state) => {
  const result = char('\n').parse(input, state);

  if (!result.success) return result;

  const { line } = result.position;

  return { success: true, value: '\n', position: { ...result.position, column: 1, line: line + 1 } };
});
