import { either } from '../../../parser-combinators';
import { mov } from './mov';

export const instruction = either(mov);
