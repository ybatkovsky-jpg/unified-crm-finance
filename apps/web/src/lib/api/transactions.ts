/**
 * Transaction API Client
 *
 * TypeScript client for Transaction API with fetch wrapper.
 * Provides typed methods for CRUD operations with soft-delete.
 */

import type {
  TransactionData,
  TransactionListParams,
  TransactionCreateInput,
  TransactionUpdateInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class TransactionApiClient {
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
   * GET /api/transactions
   *
   * List transactions with optional filters.
   */
  async getTransactions(params?: TransactionListParams): Promise<ApiListResponse<TransactionData>> {
    const queryParams: Record<string, string | undefined> = {};

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          queryParams[key] = String(value);
        }
      }
    }

    const response = await this.fetchFn(
      this.url('/transactions', queryParams),
      { headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<TransactionData>>(response);
  }

  /**
   * GET /api/transactions/[id]
   */
  async getTransaction(id: string): Promise<ApiResponse<TransactionData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/transactions/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<TransactionData>>(response);
  }

  /**
   * POST /api/transactions
   */
  async createTransaction(data: TransactionCreateInput): Promise<ApiResponse<TransactionData>> {
    const response = await this.fetchFn(this.url('/transactions'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<TransactionData>>(response);
  }

  /**
   * PATCH /api/transactions/[id]
   */
  async updateTransaction(
    id: string,
    data: TransactionUpdateInput
  ): Promise<ApiResponse<TransactionData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/transactions/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<TransactionData>>(response);
  }

  /**
   * DELETE /api/transactions/[id]
   *
   * Soft-deletes a transaction.
   */
  async deleteTransaction(
    id: string
  ): Promise<ApiResponse<TransactionData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/transactions/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<TransactionData> & { message: string }>(response);
  }
}

/** Default singleton instance */
export const transactionsApi = new TransactionApiClient();

/** Convenience exports */
export const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = transactionsApi;

export default transactionsApi;
