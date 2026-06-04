import { map, sequence, lazy, or } from '../../parser-combinators';
import { optionalWhitespace } from './optional-whitespace';
import { register } from './register';
import { minus, comma } from './tokens';

const registerListItem = or(
  map(sequence(register, minus, register), (value) => {
    const start = value[0].value;
    const end = value[2].value;
    const values = [];

    for (let i = start; i <= end; i++) values.push(i);

    return {
      type: 'RegisterRange',
      start,
      end,
      value: values,
    };
  }),
  register,
);

export const registerList: any = lazy(() =>
  map(or(sequence(registerListItem, comma, optionalWhitespace, registerList), registerListItem), (value) => {
    if (Array.isArray(value)) {
      const listItem = value[0];
      const list = listItem.type === 'RegisterRange' ? listItem.value : [listItem.value];

      list.push(...value[3].value);

      return {
        type: 'RegisterList',
        value: list,
      };
    }

    return {
      type: 'RegisterList',
      value: value.type === 'RegisterRange' ? value.value : [value.value],
    };
  }),
);
