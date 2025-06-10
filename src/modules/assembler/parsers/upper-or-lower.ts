import { either, map, string } from '../../parser-combinators';

export const upperOrLower = (str: string) =>
  map(either(string(str.toUpperCase()), string(str.toLowerCase())), (value) => value.toUpperCase());
