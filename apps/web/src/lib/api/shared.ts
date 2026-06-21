/**
 * Shared API Client Helpers
 *
 * parseApiError, parseJson, and ApiClientError used by all API clients.
 */

import type { ApiError } from './types';

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
