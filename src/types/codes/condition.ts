import * as CONDITION from '../../constants/codes/condition';

export type Condition = (typeof CONDITION)[keyof typeof CONDITION];
