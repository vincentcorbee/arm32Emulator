import { ParserFunction, ParserInterface, ParserState, Result } from './types';

export class Parser<T = any> implements ParserInterface<T> {
  #parserFunction: ParserFunction<T>;

  constructor(parserFunction: ParserFunction<T>) {
    this.#parserFunction = parserFunction;
  }

  parse(input: string, state: ParserState = { position: { index: 0, line: 1, column: 1 } }): Result<T> {
    return this.#parserFunction(input, state);
  }
}
