import defaultTo from 'defaultTo';
import hasOwnProperty from 'hasOwnProperty';
import { isStringValue } from 'isStringValue';
import optionalFunctionValue from 'optionalFunctionValue';

import ctx from 'ctx';
import { produceBase, ReadOnlySuiteResult } from 'produceBase';

export default function include(fieldName: string): {
  when: (
    condition: string | boolean | ((draft: ReadOnlySuiteResult) => boolean)
  ) => void;
} {
  const context = ctx.useX();
  const { inclusion, exclusion } = context;

  if (!fieldName) {
    return { when };
  }

  inclusion[fieldName] = defaultTo(exclusion.tests[fieldName], true);

  return { when };

  function when(
    condition: string | ((draft: ReadOnlySuiteResult) => boolean) | boolean
  ): void {
    const context = ctx.useX();
    const { inclusion, exclusion } = context;

    inclusion[fieldName] = (): boolean => {
      if (hasOwnProperty(exclusion.tests, fieldName)) {
        return defaultTo(exclusion.tests[fieldName], true);
      }

      if (isStringValue(condition)) {
        return Boolean(exclusion.tests[condition]);
      }

      return optionalFunctionValue(
        condition,
        optionalFunctionValue(produceBase)
      );
    };
  }
}
