import retry from 'retry';
import { log } from './logger/logger';

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

/**
 * Generic retry mechanism for API calls
 * @param operation The async operation to retry
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelayMs Base delay between retries in milliseconds
 * @returns The result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  retryDelayMs = 200,
): Promise<T> {
  let retryCount = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      retryCount++;

      if (retryCount >= maxRetries) {
        log.error({
          message: error?.message || '',
          stack: error?.stack || '',
          detail: `Failed after ${maxRetries} retry attempts`,
          endpoint: 'withRetry',
        });
        throw error;
      }

      const delay = retryDelayMs * Math.pow(2, retryCount - 1);

      let logMessage = `Retry attempt ${retryCount}/${maxRetries} after ${delay}ms`;
      if (error.message?.includes('429')) {
        logMessage = `Rate limit exceeded. ${logMessage}`;
      } else {
        logMessage = `Error: ${error.message}. ${logMessage}`;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
