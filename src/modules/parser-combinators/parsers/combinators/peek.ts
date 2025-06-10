import { Parser } from '../../parser';

export const peek = <T = any>(parser: Parser<T>) =>
  new Parser<T>((input, state) => {
    const result = parser.parse(input, state);

    if (result.success) return { success: true, value: result.value, position: { ...state.position } };

    return { success: false, message: 'Peek failed', position: { ...state.position } };
  });
