import assign from 'assign';
import createCache from 'cache';
import { isEmpty } from 'isEmpty';
import isFunction from 'isFunction';

import ctx from 'ctx';
import hasRemainingTests from 'hasRemainingTests';
import { produceBase, ReadOnlySuiteResult } from 'produceBase';
import { useStateRef, useTestCallbacks, useTestsFlat } from 'stateHooks';

const cache = createCache(20);

export function produceFullResult(): SuiteResult {
  const testObjects = useTestsFlat();
  const ctxRef = { stateRef: useStateRef() };
  return cache(
    [testObjects],
    ctx.bind(ctxRef, () =>
      assign({}, produceBase(), {
        done: ctx.bind(ctxRef, done),
      })
    )
  );
}

/**
 * DONE is here and not in its own module to prevent circular dependency issues.
 */

function shouldSkipDoneRegistration(
  callback: (res: ReadOnlySuiteResult) => void,

  fieldName: string | undefined,
  output: SuiteResult
): boolean {
  // If we do not have any test runs for the current field
  return !!(
    !isFunction(callback) ||
    (fieldName &&
      (!output.tests[fieldName] || isEmpty(output.tests[fieldName].testCount)))
  );
}

function shouldRunDoneCallback(fieldName?: string): boolean {
  // is suite finished || field name exists, and test is finished;

  return !!(
    !hasRemainingTests() ||
    (fieldName && !hasRemainingTests(fieldName))
  );
}

/**
 * Registers done callbacks.
 * @register {Object} Vest output object.
 */
const done: IDone = function done(...args): SuiteResult {
  const [callback, fieldName] = args.reverse() as [
    (res: ReadOnlySuiteResult) => void,
    string
  ];

  const output = produceFullResult();

  if (shouldSkipDoneRegistration(callback, fieldName, output)) {
    return output;
  }

  const doneCallback = () => callback(produceBase());

  if (shouldRunDoneCallback(fieldName)) {
    doneCallback();
    return output;
  }

  deferDoneCallback(doneCallback, fieldName);

  return output;
};

function deferDoneCallback(doneCallback: () => void, fieldName?: string): void {
  const deferredCallback = ctx.bind({}, doneCallback);
  const [, setTestCallbacks] = useTestCallbacks();
  setTestCallbacks(current => {
    if (fieldName) {
      current.fieldCallbacks[fieldName] = (
        current.fieldCallbacks[fieldName] || []
      ).concat(deferredCallback);
    } else {
      current.doneCallbacks.push(deferredCallback);
    }
    return current;
  });
}

export type SuiteResult = ReadOnlySuiteResult & { done: IDone };

interface IDone {
  (...args: [cb: (res: ReadOnlySuiteResult) => void]): SuiteResult;
  (
    ...args: [fieldName: string, cb: (res: ReadOnlySuiteResult) => void]
  ): SuiteResult;
}
