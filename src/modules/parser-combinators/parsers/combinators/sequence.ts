import { Parser } from '../../parser';

export const sequence = <T = any>(...parsers: Parser[]) =>
  new Parser<T[]>((input, { position }) => {
    const { index, column, line } = position;

    let nextIndex = index;
    let nextColumn = column;
    let nextLine = line;

    const value = [];

    for (const parser of parsers) {
      const result = parser.parse(input, { position: { index: nextIndex, column: nextColumn, line: nextLine } });

      if (!result.success) return result;

      value.push(result.value);

      nextIndex = result.position.index;
      nextColumn = result.position.column;
      nextLine = result.position.line;
    }

    return { success: true, value, position: { index: nextIndex, column: nextColumn, line: nextLine } };
  });
