import * as CONDITION from '../../constants/mnemonics/condition';

export type Condition = typeof CONDITION[keyof typeof CONDITION];
