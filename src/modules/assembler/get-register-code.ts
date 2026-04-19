import { RegisterNameToCode } from '../../constants/maps';
import { RegisterName } from '../../types/mnemonics/registers';

export function getRegisterCode(node: any): any {
  const { value } = node;

  const register = RegisterNameToCode[value as RegisterName];

  if (register === undefined) throw Error(`Unknown register ${value}`);

  return register;
}
