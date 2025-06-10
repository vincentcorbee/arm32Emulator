import { formatHex } from '../../utils';
import { MemoryInterface } from './types';

export class Memory implements MemoryInterface {
  #buffer: ArrayBuffer;
  #dataView: DataView;
  #endianness: 'little' | 'big';

  constructor(size: number, endianness: 'little' | 'big' = 'little') {
    this.#buffer = new ArrayBuffer(size);
    this.#dataView = new DataView(this.#buffer);
    this.#endianness = endianness;
  }

  get buffer(): ArrayBuffer {
    return this.#buffer;
  }

  getBufferSlice(address: number, length: number): ArrayBuffer {
    return this.#buffer.slice(address, address + length);
  }

  readUint8(offset: number): number {
    return this.#dataView.getUint8(offset);
  }

  writeUint8(offset: number, value: number): void {
    this.#dataView.setUint8(offset, value);
  }

  readUint16(offset: number): number {
    return this.#dataView.getUint16(offset, this.#endianness === 'little');
  }

  writeUint16(offset: number, value: number): void {
    this.#dataView.setUint16(offset, value, this.#endianness === 'little');
  }

  readUint32(offset: number): number {
    return this.#dataView.getUint32(offset, this.#endianness === 'little');
  }

  writeUint32(offset: number, value: number): void {
    this.#dataView.setUint32(offset, value, this.#endianness === 'little');
  }

  writeInt32(offset: number, value: number): void {
    this.#dataView.setInt32(offset, value, this.#endianness === 'little');
  }

  readChar(offset: number): string {
    return String.fromCharCode(this.readUint8(offset));
  }

  view(): void {
    const byteLength = this.#buffer.byteLength;
    const rows = Math.floor(byteLength / 16);

    let currentAddress = 0;

    for (let i = 0; i < rows; i++) {
      let line = `${formatHex(currentAddress)}:`;
      let chars = '';

      for (let j = 0; j < 4; j++) {
        const end = currentAddress + j * 4 >= byteLength;

        for (let k = 0; k < 4; k++) {
          if (end) {
            chars += '·';

            continue;
          }

          const char = this.readChar(currentAddress + k);
          const code = char.charCodeAt(0);

          /* Only print printable ASCII characters */
          chars += code >= 0x20 && code <= 0x7e ? char : '·';
        }

        chars += ' ';
        line += ' ';
        line += end ? 'xxxxxxxxxx' : formatHex(this.readUint32(currentAddress + j * 4));

        currentAddress = currentAddress += 4;
      }

      line += ` ${chars}\n`;

      process.stdout.write(line);
    }
  }

  viewAt(address: number, options?: { length: number }): void {
    const { length = 4 } = options || {};
    const byteLength = this.#buffer.byteLength;
    const rows = Math.ceil(length / 4);

    let currentAddress = address;

    for (let i = 0; i < rows; i++) {
      let line = `${formatHex(currentAddress)}:`;
      let chars = '';

      for (let j = 0; j < 4; j++) {
        const end = currentAddress + j * 4 >= byteLength;

        for (let k = 0; k < 4; k++) {
          if (end) {
            chars += '·';

            continue;
          }

          const char = this.readChar(currentAddress + k);
          const code = char.charCodeAt(0);

          /* Only print printable ASCII characters */
          chars += code >= 0x20 && code <= 0x7e ? char : '·';
        }

        chars += ' ';
        line += ' ';
        line += end ? 'xxxxxxxxxx' : formatHex(this.readUint32(currentAddress + j * 4));

        currentAddress = currentAddress += 4;
      }

      line += ` ${chars}\n`;

      process.stdout.write(line);
    }
  }
}
