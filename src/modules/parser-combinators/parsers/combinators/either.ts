import { Parser } from '../../parser';

export const either = <T = string>(...choices: Parser[]) =>
  new Parser<T>((input, state) => {
    for (const parser of choices) {
      const result = parser.parse(input, state);

      if (result.success) return result;
    }

    return { success: false, message: 'No parser matched', position: { ...state.position } };
  });
