/**
 * ChangeOrder API Client (PROJ-11)
 *
 * Typed client for additional works / change orders:
 * CRUD + status transitions.
 */

import type {
  ChangeOrderData,
  ChangeOrderCreateInput,
  ChangeOrderUpdateInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class ChangeOrderApiClient {
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
        if (value !== undefined) searchParams.append(key, value);
      }
      const queryString = searchParams.toString();
      if (queryString) return `${fullUrl}?${queryString}`;
    }
    return fullUrl;
  }

  /** GET /api/projects/[projectId]/change-orders */
  async getChangeOrders(projectId: string): Promise<ApiListResponse<ChangeOrderData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/change-orders`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<ChangeOrderData>>(response);
  }

  /** GET /api/change-orders/[id] */
  async getChangeOrder(id: string): Promise<ApiResponse<ChangeOrderData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/change-orders/${id}`), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ChangeOrderData>>(response);
  }

  /** POST /api/projects/[projectId]/change-orders */
  async createChangeOrder(
    projectId: string,
    data: ChangeOrderCreateInput
  ): Promise<ApiResponse<ChangeOrderData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/change-orders`),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ChangeOrderData>>(response);
  }

  /** PATCH /api/change-orders/[id] */
  async updateChangeOrder(
    id: string,
    data: ChangeOrderUpdateInput
  ): Promise<ApiResponse<ChangeOrderData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/change-orders/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ChangeOrderData>>(response);
  }

  /** DELETE /api/change-orders/[id] */
  async deleteChangeOrder(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/change-orders/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<{ deleted: boolean }>>(response);
  }
}

export const changeOrdersApi = new ChangeOrderApiClient();

export const {
  getChangeOrders,
  getChangeOrder,
  createChangeOrder,
  updateChangeOrder,
  deleteChangeOrder,
} = changeOrdersApi;

export default changeOrdersApi;
