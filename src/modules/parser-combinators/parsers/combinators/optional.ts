import { Parser } from '../../parser';

export const optional = <T = string, D = any>(parser: Parser<T>, defaultValue?: D | (() => D)) =>
  new Parser<T | D | null>((input, state) => {
    const result = parser.parse(input, state);

    if (result.success) return result;

    const value = typeof defaultValue === 'function' ? (defaultValue as () => D)() : (defaultValue ?? null);

    return { success: true, value, position: { ...state.position } };
  });
