import { greaterThan } from 'greaterThan';
import hasOwnProperty from 'hasOwnProperty';

import type { ReadOnlySuiteResult } from 'produceBase';
import type { SuiteResult } from 'produceSuiteResult';

export function parse(res: SuiteResult | ReadOnlySuiteResult): {
  valid: (fieldName?: string) => boolean;
  tested: (fieldName?: string) => boolean;
  invalid: (fieldName?: string) => boolean;
  untested: (fieldName?: string) => boolean;
  warning: (fieldName?: string) => boolean;
} {
  const testedStorage: Record<string, boolean> = {};

  const selectors = {
    invalid: res.hasErrors,
    tested: (fieldName?: string): boolean => {
      if (!fieldName) {
        return greaterThan(res.testCount, 0);
      }

      if (hasOwnProperty(testedStorage, fieldName))
        return testedStorage[fieldName];

      testedStorage[fieldName] =
        hasOwnProperty(res.tests, fieldName) &&
        greaterThan(res.tests[fieldName].testCount, 0);

      return selectors.tested(fieldName);
    },
    untested: (fieldName?: string): boolean =>
      res.testCount === 0 || !selectors.tested(fieldName),
    valid: res.isValid,
    warning: res.hasWarnings,
  };

  return selectors;
}
