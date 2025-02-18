import { DeviceInterface, MemoryInterface } from "./types";

export class Memory implements MemoryInterface, DeviceInterface {
  #buffer: ArrayBuffer;
  #dataView: DataView
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

  viewAt(address: number, options?: { length: number }): void {
    const { length = 4 } = options || {};

    const byteLength = this.#buffer.byteLength;

    const rows = Math.ceil(length / 4);
    let currentAddress = address

    for(let i = 0; i < rows; i ++) {
      let line = `0x${(currentAddress).toString(16).padStart(8, '0')}:`;
      let chars = ''

      for (let j = 0; j < 4; j ++) {
        if (currentAddress + j * 4 >= byteLength) return;

        for (let k = 0; k < 4; k++) {
          /* Need to escape characters like \n, \t etc */
          const char = this.readChar(currentAddress + k).replace('\n', '\\n');

          chars += char !== '\x00' ? char : '·';
        }

        chars += ' ';

        line += ` 0x${this.readUint32(currentAddress + j * 4).toString(16).padStart(8, '0')}`;

        currentAddress = currentAddress += 4;
      }

      line += ` ${chars}\n`;

      process.stdout.write(line);
    }
  }

  view(): void {
    const byteLength = this.#buffer.byteLength;

    const rows = Math.floor(byteLength / 4);
    let currentAddress = 0

    for(let i = 0; i < rows; i ++) {
      let line = `0x${(currentAddress).toString(16).padStart(8, '0')}:`;
      let chars = ''

      for (let j = 0; j < 4; j ++) {
        if (currentAddress + j * 4 >= byteLength) return;

        for (let k = 0; k < 4; k++) {
          const char = this.readChar(currentAddress + k);
          const code = char.charCodeAt(0);

          /* Only print printable ASCII characters */
          chars += code >= 0x20 && code <= 0x7e ? char : '·';
        }

        chars += ' ';

        line += ` 0x${this.readUint32(currentAddress + j * 4).toString(16).padStart(8, '0')}`;

        currentAddress = currentAddress += 4;
      }

      line += ` ${chars}\n`;

      process.stdout.write(line);
    }
  }

  readUint8(offset: number): number {
    return this.#dataView.getUint8(offset);
  }

  readChar(offset: number): string {
    return String.fromCharCode(this.readUint8(offset));
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
}