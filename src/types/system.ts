export type IOChannel = {
  write: IOWriteHandler;
  read: IOReadHandler;
};

export type IOWriteHandler = (buffer: string | Uint8Array<ArrayBufferLike>, cb?: (err?: Error) => void) => boolean;
export type IOReadHandler = (size?: number | undefined) => any;

export type Exit = (code?: string | number | null | undefined) => void | never;

export type IO = {
  stdout: IOChannel;
  stdin: IOChannel;
  stderr: IOChannel;
};

export type System = {
  io: IO;
  exit: Exit;
};
