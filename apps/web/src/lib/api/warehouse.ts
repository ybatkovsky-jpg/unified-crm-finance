/**
 * Warehouse API Client (S06)
 *
 * Typed client for the warehouse API: item CRUD + stock transactions
 * (приём/расход/резерв/разрезерв).
 */
import type {
  WarehouseItemData,
  WarehouseItemDetail,
  WarehouseTransactionData,
  WarehouseListParams,
  WarehouseItemCreateInput,
  WarehouseItemUpdateInput,
  WarehouseTransactionInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class WarehouseApiClient {
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

  /** GET /api/warehouse — list (optional search, lowStockOnly) */
  async getItems(params: WarehouseListParams = {}): Promise<ApiListResponse<WarehouseItemData>> {
    const response = await this.fetchFn(
      this.url('/warehouse', {
        search: params.search,
        lowStockOnly: params.lowStockOnly ? '1' : undefined,
      }),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<WarehouseItemData>>(response);
  }

  /** GET /api/warehouse/[id] — item with transaction history */
  async getItem(id: string): Promise<ApiResponse<WarehouseItemDetail>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/warehouse/${id}`), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<WarehouseItemDetail>>(response);
  }

  /** POST /api/warehouse — create item */
  async createItem(data: WarehouseItemCreateInput): Promise<ApiResponse<WarehouseItemData>> {
    const response = await this.fetchFn(this.url('/warehouse'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<WarehouseItemData>>(response);
  }

  /** PATCH /api/warehouse/[id] — update item metadata */
  async updateItem(id: string, data: WarehouseItemUpdateInput): Promise<ApiResponse<WarehouseItemData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/warehouse/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<WarehouseItemData>>(response);
  }

  /** DELETE /api/warehouse/[id] */
  async deleteItem(id: string): Promise<ApiResponse<WarehouseItemData> & { message: string }> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/warehouse/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<WarehouseItemData> & { message: string }>(response);
  }

  /** POST /api/warehouse/[id]/transactions — apply a stock transaction */
  async applyTransaction(
    id: string,
    input: WarehouseTransactionInput
  ): Promise<ApiResponse<WarehouseTransactionData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/warehouse/${id}/transactions`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(input),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<WarehouseTransactionData>>(response);
  }
}

/** Default singleton instance */
export const warehouseApi = new WarehouseApiClient();

/** Convenience exports */
export const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  applyTransaction,
} = warehouseApi;

export default warehouseApi;
