export type Result<T = any> = Success<T> | Failure;

export type Position = {
  index: number;
  column: number;
  line: number;
};

export type Success<T> = {
  success: true;
  value: T;
  position: Position;
};

export type Failure = {
  success: false;
  message: string;
  position: Position;
};

export type ParserState = {
  position: Position;
};

export type ParserFunction<T = any> = (input: string, parserState: ParserState) => Result<T>;
