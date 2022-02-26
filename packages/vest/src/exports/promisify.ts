import isFunction from 'isFunction';
import throwError from 'throwError';

import { ReadOnlySuiteResult } from 'produceBase';
import { SuiteResult } from 'produceSuiteResult';

const promisify =
  (validatorFn: (...args: any[]) => SuiteResult) =>
  (...args: any[]): Promise<ReadOnlySuiteResult> => {
    if (!isFunction(validatorFn)) {
      throwError('promisify: Expected validatorFn to be a function.');
    }

    return new Promise(resolve => validatorFn(...args).done(resolve));
  };

export default promisify;
