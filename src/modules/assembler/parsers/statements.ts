import { lazy, map, or } from '../../parser-combinators';
import { sequence } from '../../parser-combinators/parsers/combinators/sequence';
import { statement } from './statement';

export const statements: any = map(
  lazy(() => or(sequence(statement, statements), statement)),
  (value) => {
    if (Array.isArray(value)) {
      if (value.length === 1) return value;

      const [first, second] = value;

      if (first.type === 'LabeledStatement') {
        const statements = [...first.labels];

        if (first.value.type !== 'EmptyStatement') {
          statements.push(first.value);
        }

        statements.push(...second);

        return statements;
      }

      if (first.type === 'EmptyStatement') return second;

      return [first, ...second];
    }

    if (value.type === 'LabeledStatement') {
      if (value.value.type === 'EmptyStatement') return value.labels;

      return [...value.labels, value.value];
    }

    return [value];
  },
);
