import { Parser } from '../../parser';

export const regexp = (pattern: RegExp) =>
  new Parser<string>((input, { position }) => {
    const { index, column, line } = position;
    const regexp = new RegExp(pattern.source, 'y');

    regexp.lastIndex = index;

    const match = input.match(regexp);

    if (match) {
      const [value] = match;

      return { success: true, value, position: { index: index + value.length, column: column + value.length, line } };
    }

    return { success: false, message: `Expected ${pattern}`, position: { ...position } };
  });
