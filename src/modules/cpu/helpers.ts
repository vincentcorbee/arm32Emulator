import { IO, System } from '../../types/system';

export function getIO(): IO {
  if (globalThis.process === undefined) {
    return {
      stdin: {
        write(data) {
          console.log(data);

          return true;
        },
        read() {},
      },
      stdout: {
        write(data) {
          console.log(data);

          return true;
        },
        read() {},
      },
      stderr: {
        write(data) {
          console.error(data);

          return true;
        },
        read() {},
      },
    };
  }

  return {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
  };
}

export function getSystem(): System {
  return {
    io: getIO(),
    exit: globalThis.process === undefined ? () => {} : process.exit,
  };
}
