import { either } from '../../../parser-combinators';
import { labelExpression } from './label-expression';
import { number } from '../number';
import { parenthesizedExpression } from './parenthesized-expression';
import { characterConstant } from '../tokens';

export const primaryExpression: any = either(number, labelExpression, characterConstant, parenthesizedExpression);
