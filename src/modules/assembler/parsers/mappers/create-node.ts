export const createNode =
  <T = any>(type: string) =>
  (value: T) => ({ value, type });
