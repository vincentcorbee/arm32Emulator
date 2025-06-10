export function toIEEE754SinglePrecision(value: number) {
  let sign: number;
  let exponent: number;
  let mantissa: number;

  if (value === 0) {
    sign = 1 / value === -Infinity ? 1 : 0;
    exponent = 0;
    mantissa = 0;
  } else if (value === Infinity) {
    sign = 0;
    exponent = 0xff;
    mantissa = 0;
  } else if (value === -Infinity) {
    sign = 1;
    exponent = 0xff;
    mantissa = 0;
  } else if (isNaN(value)) {
    /* Quiet NaN */
    sign = 0;
    exponent = 0xff;
    mantissa = 1;
  } else {
    sign = value < 0 ? 1 : 0;

    const absoluteValue = Math.abs(value);
    const unbiasedExponent = Math.floor(Math.log2(absoluteValue));

    /* Subnormal value */
    if (unbiasedExponent < -126) {
      exponent = 0;
      mantissa = Math.floor((absoluteValue * (1 << 23)) / 2 ** -126);
    } else if (unbiasedExponent >= 128) {
      /* Infinity */
      exponent = 0xff;
      mantissa = 0;
    } else {
      const normalizedMantissa = absoluteValue / 2 ** unbiasedExponent;

      exponent = unbiasedExponent + 127;
      mantissa = Math.floor((normalizedMantissa - 1) * (1 << 23));
    }
  }

  return ((sign << 31) | (exponent << 23) | mantissa) >>> 0;
}
