import { floatDirective } from '../src/modules/assembler/parsers/directives/float-directive';
import { toIEEE754SinglePrecision } from '../src/modules/assembler/to-ieee754-single-precision';

console.log(toIEEE754SinglePrecision(19.59375).toString(16).padStart(8, '0'));
console.log(toIEEE754SinglePrecision(0.5e-41).toString(16).padStart(8, '0'));
console.log(toIEEE754SinglePrecision(-2.5).toString(16).padStart(8, '0'));

console.dir(floatDirective.parse('.float 19.59375'), { depth: null });

// const value = 0x3fabe76d

// const sign = value >> 31 & 0x1
// const exponent = (value >> 24 & 0xff) - 127
// const fraction = (value & 0x7fffff) + 1

// console.log({ fraction, exponent, sign })

// console.log(value.toString(2).padStart(32, '0'))

// const result = fraction * 2 ** exponent
