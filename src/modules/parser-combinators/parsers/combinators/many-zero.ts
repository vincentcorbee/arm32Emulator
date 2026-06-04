import { Parser } from '../../parser';
import { many } from './many';

export const many0 = <T = string>(parser: Parser<T>) =>
  new Parser<T[]>((input, state) => {
    const result = many(parser).parse(input, state);

    if (result.success) return result;

    return { success: true, value: [], position: { ...state.position } };
  });
