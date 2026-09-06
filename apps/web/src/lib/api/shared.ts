/**
 * Shared API Client Helpers
 *
 * parseApiError, parseJson, and ApiClientError used by all API clients.
 */

import type { ApiError } from './types';

/**
 * Bind every prototype method of `instance` to the instance itself.
 *
 * Class methods lose their `this` when they are destructured off an instance
 * (e.g. `const { getContactInteractions } = interactionsApi`), which makes
 * internal lookups like `this.fetchFn` fail with
 * "Cannot read properties of undefined". Binding the methods up front keeps
 * those convenience exports safe.
 */
export function bindMethods<T extends object>(instance: T): T {
  const proto = Object.getPrototypeOf(instance);
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue;
    const value = (instance as Record<string, unknown>)[key];
    if (typeof value === 'function') {
      (instance as Record<string, unknown>)[key] = Function.prototype.bind.call(
        value,
        instance
      );
    }
  }
  return instance;
}

/**
 * API client error class
 */
export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public message: string
  ) {
    super(`${error}: ${message}`);
    this.name = 'ApiClientError';
  }
}

/**
 * Parse and throw API error from response
 */
export async function parseApiError(response: Response): Promise<never> {
  let error: ApiError;

  try {
    error = await response.json();
  } catch {
    error = {
      error: 'Unknown error',
      message: response.statusText || 'Failed to parse error response',
    };
  }

  console.error('API request failed:', response.status, error);
  throw new ApiClientError(response.status, error.error, error.message);
}

/**
 * Validate response is JSON and parse it
 */
export async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    console.error('Unexpected content-type:', contentType);
    throw new ApiClientError(
      response.status,
      'Invalid response',
      'Expected JSON response but got ' + (contentType || 'no content-type')
    );
  }

  return response.json() as Promise<T>;
}
