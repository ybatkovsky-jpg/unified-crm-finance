/**
 * Counterparty API Client
 *
 * TypeScript client for Counterparty API with fetch wrapper.
 * Provides typed methods for CRUD operations on counterparties.
 */

import type {
  CounterpartyData,
  CounterpartyListParams,
  CounterpartyCreateInput,
  CounterpartyUpdateInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

/**
 * Default base URL for API requests
 */
const DEFAULT_BASE_URL = '/api';

/**
 * Counterparty API Client
 *
 * Provides typed methods for Counterparty CRUD operations.
 * All methods return typed data or throw ApiClientError.
 */
export class CounterpartyApiClient {
  private baseUrl: string;
  private fetchFn: typeof globalThis.fetch;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = config.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Build full URL for endpoint
   */
  private url(path: string, params?: Record<string, string | undefined>): string {
    const fullUrl = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        return `${fullUrl}?${queryString}`;
      }
    }

    return fullUrl;
  }

  /**
   * GET /api/counterparties
   *
   * List all counterparties with optional filtering.
   * Supports filtering by type and search.
   *
   * @returns Array of counterparties with count
   */
  async getCounterparties(params?: CounterpartyListParams): Promise<ApiListResponse<CounterpartyData>> {
    const response = await this.fetchFn(
      this.url('/counterparties', {
        type: params?.type,
        search: params?.search,
      }),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<CounterpartyData>>(response);
  }

  /**
   * GET /api/counterparties/[id]
   *
   * Fetch a single counterparty by ID.
   *
   * @param id - Counterparty UUID
   * @returns Counterparty data
   * @throws ApiClientError with 404 if not found
   */
  async getCounterparty(id: string): Promise<ApiResponse<CounterpartyData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/counterparties/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CounterpartyData>>(response);
  }

  /**
   * POST /api/counterparties
   *
   * Create a new counterparty.
   *
   * @param data - Counterparty creation input
   * @returns Created counterparty data
   * @throws ApiClientError with 400 on validation errors
   */
  async createCounterparty(data: CounterpartyCreateInput): Promise<ApiResponse<CounterpartyData>> {
    const response = await this.fetchFn(this.url('/counterparties'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CounterpartyData>>(response);
  }

  /**
   * PUT /api/counterparties/[id]
   *
   * Update an existing counterparty.
   * Only provided fields are updated (partial update).
   *
   * @param id - Counterparty UUID
   * @param data - Counterparty update input (all fields optional)
   * @returns Updated counterparty data
   * @throws ApiClientError with 404 if counterparty not found
   */
  async updateCounterparty(
    id: string,
    data: CounterpartyUpdateInput
  ): Promise<ApiResponse<CounterpartyData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/counterparties/${id}`), {
      method: 'PUT',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CounterpartyData>>(response);
  }

  /**
   * DELETE /api/counterparties/[id]
   *
   * Soft-delete a counterparty by setting deletedAt timestamp.
   * Counterparty remains in database but is filtered from queries.
   *
   * @param id - Counterparty UUID
   * @returns Deleted counterparty data with success message
   * @throws ApiClientError with 404 if counterparty not found
   */
  async deleteCounterparty(id: string): Promise<ApiResponse<CounterpartyData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/counterparties/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CounterpartyData> & { message: string }>(response);
  }
}

/**
 * Default singleton instance for use across the application
 */
export const counterpartiesApi = new CounterpartyApiClient();

/**
 * Convenience exports for direct use
 */
export const {
  getCounterparties,
  getCounterparty,
  createCounterparty,
  updateCounterparty,
  deleteCounterparty,
} = counterpartiesApi;

export default counterpartiesApi;
