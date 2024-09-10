import retry from 'retry';

/**
 * Retry an asynchronous function with specified options.
 * @param {Function} asyncFunction - The asynchronous function to retry.
 * @param {Array} args - The arguments to pass to the asynchronous function.
 * @param {Object} options - Retry options.
 * @returns {Promise<any>} - The result of the asynchronous function.
 */
export async function retryAsyncFunction(
  asyncFunction: (...args: any[]) => Promise<any>,
  args: any[],
  options = {},
): Promise<any> {
  return new Promise((resolve, reject) => {
    const operation = retry.operation(options);

    operation.attempt(async (currentAttempt) => {
      try {
        const result = await asyncFunction(...args);
        resolve(result);
      } catch (error) {
        if (operation.retry(error)) {
          return;
        }
        reject(operation.mainError());
      }
    });
  });
}

/**
 * Retry a Promise.all call with specified options.
 * @param {Promise<any>[]} promises - The array of promises to retry.
 * @param {Object} options - Retry options.
 * @returns {Promise<any[]>} - The result of Promise.all.
 */
export async function retryPromiseAll(
  promises: Promise<any>[],
  options = {},
): Promise<any[]> {
  return retryAsyncFunction(Promise.all.bind(Promise), [promises], options);
}
