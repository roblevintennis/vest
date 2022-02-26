import optionalFunctionValue from 'optionalFunctionValue';

import { IsolateTypes } from 'IsolateTypes';
import ctx from 'ctx';
import { isolate } from 'isolate';
import { produceBase, ReadOnlySuiteResult } from 'produceBase';

/**
 * Conditionally skips running tests within the callback.
 *
 * @example
 *
 * skipWhen(res => res.hasErrors('username'), () => {
 *  test('username', 'User already taken', async () => await doesUserExist(username)
 * });
 */
export default function skipWhen(
  conditional: boolean | ((draft: ReadOnlySuiteResult) => boolean),
  callback: (...args: any[]) => void
): void {
  isolate({ type: IsolateTypes.SKIP_WHEN }, () => {
    ctx.run(
      {
        skipped:
          // Checking for nested conditional. If we're in a nested skipWhen,
          // we should skip the test if the parent conditional is true.
          isExcludedIndividually() ||
          // Otherwise, we should skip the test if the conditional is true.
          optionalFunctionValue(
            conditional,
            optionalFunctionValue(produceBase)
          ),
      },
      () => callback()
    );
  });
}

export function isExcludedIndividually(): boolean {
  return !!ctx.useX().skipped;
}
