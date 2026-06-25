/**
 * Budget API Client
 *
 * TypeScript client for Budget API with fetch wrapper.
 * Provides typed methods for CRUD operations on budgets.
 */

import type {
  BudgetData,
  BudgetListParams,
  BudgetCreateInput,
  BudgetUpdateInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class BudgetApiClient {
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
   * GET /api/budgets
   *
   * List budgets with optional filters: projectId, categoryId, period.
   * At least one of projectId or period must be provided.
   */
  async getBudgets(params: BudgetListParams): Promise<ApiListResponse<BudgetData>> {
    const queryParams: Record<string, string | undefined> = {};

    if (params?.projectId) queryParams.projectId = params.projectId;
    if (params?.categoryId) queryParams.categoryId = params.categoryId;
    if (params?.period) queryParams.period = params.period;

    const response = await this.fetchFn(
      this.url('/budgets', queryParams),
      { headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<BudgetData>>(response);
  }

  /**
   * GET /api/budgets/[id]
   *
   * Fetch a single budget by ID.
   */
  async getBudget(id: string): Promise<ApiResponse<BudgetData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/budgets/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BudgetData>>(response);
  }

  /**
   * POST /api/budgets
   *
   * Create a new budget.
   */
  async createBudget(data: BudgetCreateInput): Promise<ApiResponse<BudgetData>> {
    const response = await this.fetchFn(this.url('/budgets'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BudgetData>>(response);
  }

  /**
   * PATCH /api/budgets/[id]
   *
   * Update an existing budget (partial update).
   */
  async updateBudget(
    id: string,
    data: BudgetUpdateInput
  ): Promise<ApiResponse<BudgetData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/budgets/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BudgetData>>(response);
  }

  /**
   * DELETE /api/budgets/[id]
   *
   * Permanently delete a budget.
   */
  async deleteBudget(id: string): Promise<ApiResponse<BudgetData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/budgets/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BudgetData> & { message: string }>(response);
  }
}

/** Default singleton instance */
export const budgetsApi = new BudgetApiClient();

/** Convenience exports for direct use */
export const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
} = budgetsApi;

export default budgetsApi;
