import { Parser } from '../../parser';

export const char = (char: string) =>
  new Parser((input, { position }) => {
    const { index, column, line } = position;
    if (input[index] === char) {
      return { success: true, value: char, position: { index: index + 1, column: column + 1, line } };
    }

    return { success: false, message: `Expected ${char}`, position: { ...position } };
  });
