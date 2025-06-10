import { Parser } from '../../parser';

export const many = <T = string>(parser: Parser<T>) =>
  new Parser((input, { position }) => {
    const { index, column, line } = position;
    const value = [];

    let nextIndex = index;
    let nextColumn = column;
    let nextLine = line;

    while (true) {
      if (nextIndex >= input.length) break;

      const result = parser.parse(input, { position: { index: nextIndex, column: nextColumn, line: nextLine } });

      if (!result.success) break;

      value.push(result.value);

      nextIndex = result.position.index;
      nextColumn = result.position.column;
      nextLine = result.position.line;
    }

    if (value.length === 0) return { success: false, message: 'No matches', position: { index, column, line } };

    return { success: true, value, position: { index: nextIndex, column: nextColumn, line: nextLine } };
  });
