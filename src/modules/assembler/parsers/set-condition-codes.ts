import { map, optional } from '../../parser-combinators';
import { S } from './tokens';

export const setConditionCodes = map(optional(S), (value) => (value ? 1 : 0));
