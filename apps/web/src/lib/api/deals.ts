/**
 * Deal API Client
 *
 * TypeScript client for Deal API with fetch wrapper.
 * Provides typed methods for CRUD operations on deals.
 */

import type {
  DealData,
  DealListParams,
  DealCreateInput,
  DealUpdateInput,
  DealMoveInput,
  DealStageData,
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
 * Deal API Client
 *
 * Provides typed methods for Deal CRUD operations.
 */
export class DealApiClient {
  private baseUrl: string;
  private fetchFn: typeof globalThis.fetch;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = config.fetch ?? fetch;
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
   * GET /api/deals
   *
   * List all deals with optional filtering.
   */
  async getDeals(params?: DealListParams): Promise<ApiListResponse<DealData>> {
    const response = await this.fetchFn(
      this.url('/deals', {
        pipelineId: params?.pipelineId,
        stageId: params?.stageId,
        managerId: params?.managerId,
        contactId: params?.contactId,
        status: params?.status,
      }),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<DealData>>(response);
  }

  /**
   * GET /api/deals/[id]
   *
   * Fetch a single deal by ID.
   */
  async getDeal(id: string): Promise<ApiResponse<DealData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/deals/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<DealData>>(response);
  }

  /**
   * POST /api/deals
   *
   * Create a new deal.
   */
  async createDeal(data: DealCreateInput): Promise<ApiResponse<DealData>> {
    const response = await this.fetchFn(this.url('/deals'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<DealData>>(response);
  }

  /**
   * PATCH /api/deals/[id]
   *
   * Update an existing deal.
   */
  async updateDeal(
    id: string,
    data: DealUpdateInput
  ): Promise<ApiResponse<DealData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/deals/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<DealData>>(response);
  }

  /**
   * DELETE /api/deals/[id]
   *
   * Soft-delete a deal.
   */
  async deleteDeal(id: string): Promise<ApiResponse<DealData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/deals/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<DealData>>(response);
  }

  /**
   * POST /api/deals/[id]/move
   *
   * Move deal to a different stage.
   */
  async moveDeal(id: string, data: DealMoveInput): Promise<ApiResponse<DealData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/deals/${id}/move`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<DealData>>(response);
  }
}

/**
 * Default singleton instance
 */
export const dealsApi = new DealApiClient();

/**
 * Convenience exports
 */
export const {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  moveDeal,
} = dealsApi;

export default dealsApi;
