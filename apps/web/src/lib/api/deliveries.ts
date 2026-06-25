/**
 * Delivery API Client (S07)
 *
 * Typed client for the delivery API: CRUD + status tracking.
 */
import type {
  DeliveryData,
  DeliveryListParams,
  DeliveryCreateInput,
  DeliveryUpdateInput,
  DeliveryStatus,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class DeliveryApiClient {
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

  /** GET /api/deliveries — list with filters */
  async getDeliveries(params: DeliveryListParams = {}): Promise<ApiListResponse<DeliveryData>> {
    const response = await this.fetchFn(
      this.url('/deliveries', {
        projectId: params.projectId,
        supplierId: params.supplierId,
        status: params.status,
      }),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<DeliveryData>>(response);
  }

  /** GET /api/deliveries/[id] */
  async getDelivery(id: string): Promise<ApiResponse<DeliveryData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/deliveries/${id}`), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<DeliveryData>>(response);
  }

  /** POST /api/deliveries — create (typically from an invoice) */
  async createDelivery(data: DeliveryCreateInput): Promise<ApiResponse<DeliveryData>> {
    const response = await this.fetchFn(this.url('/deliveries'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<DeliveryData>>(response);
  }

  /** PATCH /api/deliveries/[id] — update tracking metadata */
  async updateDelivery(id: string, data: DeliveryUpdateInput): Promise<ApiResponse<DeliveryData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/deliveries/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<DeliveryData>>(response);
  }

  /** PATCH /api/deliveries/[id]/status — status transition (delivered auto-updates warehouse) */
  async updateStatus(id: string, status: DeliveryStatus): Promise<ApiResponse<DeliveryData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/deliveries/${id}/status`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<DeliveryData>>(response);
  }
}

/** Default singleton instance */
export const deliveriesApi = new DeliveryApiClient();

/** Convenience exports */
export const { getDeliveries, getDelivery, createDelivery, updateDelivery, updateStatus } = deliveriesApi;

export default deliveriesApi;
