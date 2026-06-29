/**
 * PurchaseRequest API Client
 *
 * TypeScript client for the PurchaseRequest API (PROC-11…PROC-17).
 * Provides typed methods for CRUD, BOM grouping, email generation, send/resend,
 * status transitions, and item management.
 */
import type {
  PurchaseRequestData,
  PurchaseRequestItemData,
  SupplierGroupData,
  PurchaseRequestListParams,
  PurchaseRequestCreateInput,
  PurchaseRequestUpdateInput,
  PurchaseRequestItemCreateInput,
  PurchaseRequestStatus,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class PurchaseRequestApiClient {
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

  /** GET /api/purchase-requests — list with optional filters */
  async getPurchaseRequests(
    params: PurchaseRequestListParams = {}
  ): Promise<ApiListResponse<PurchaseRequestData>> {
    const response = await this.fetchFn(
      this.url('/purchase-requests', {
        projectId: params.projectId,
        supplierId: params.supplierId,
        status: params.status,
      }),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<PurchaseRequestData>>(response);
  }

  /** GET /api/purchase-requests/group?bomId=X — preview supplier grouping of a locked BOM */
  async groupBOM(bomId: string): Promise<ApiListResponse<SupplierGroupData>> {
    if (!bomId) throw new ApiClientError(400, 'Validation failed', 'bomId is required');
    const response = await this.fetchFn(
      this.url('/purchase-requests/group', { bomId }),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<SupplierGroupData>>(response);
  }

  /** GET /api/purchase-requests/[id] */
  async getPurchaseRequest(id: string): Promise<ApiResponse<PurchaseRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(
      this.url(`/purchase-requests/${id}`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData>>(response);
  }

  /** POST /api/purchase-requests — create from a supplier group */
  async createPurchaseRequest(
    data: PurchaseRequestCreateInput
  ): Promise<ApiResponse<PurchaseRequestData>> {
    const response = await this.fetchFn(this.url('/purchase-requests'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData>>(response);
  }

  /** PATCH /api/purchase-requests/[id] — update metadata */
  async updatePurchaseRequest(
    id: string,
    data: PurchaseRequestUpdateInput
  ): Promise<ApiResponse<PurchaseRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData>>(response);
  }

  /** DELETE /api/purchase-requests/[id] */
  async deletePurchaseRequest(
    id: string
  ): Promise<ApiResponse<PurchaseRequestData> & { message: string }> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData> & { message: string }>(response);
  }

  /** POST /api/purchase-requests/[id]/generate-email — (re)build email subject/body */
  async generateEmail(id: string): Promise<ApiResponse<PurchaseRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/${id}/generate-email`), {
      method: 'POST',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData>>(response);
  }

  /** POST /api/purchase-requests/[id]/send — log-based send (EmailLog) + status→sent */
  async sendRequest(id: string): Promise<ApiResponse<PurchaseRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/${id}/send`), {
      method: 'POST',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData>>(response);
  }

  /** POST /api/purchase-requests/[id]/resend — new EmailLog + refresh sentAt */
  async resendRequest(id: string): Promise<ApiResponse<PurchaseRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/${id}/resend`), {
      method: 'POST',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData>>(response);
  }

  /** PATCH /api/purchase-requests/[id]/status — explicit status transition */
  async updateStatus(
    id: string,
    status: PurchaseRequestStatus
  ): Promise<ApiResponse<PurchaseRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/${id}/status`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestData>>(response);
  }

  /** GET /api/purchase-requests/[id]/items */
  async getItems(requestId: string): Promise<ApiListResponse<PurchaseRequestItemData>> {
    if (!requestId) throw new ApiClientError(400, 'Validation failed', 'requestId is required');
    const response = await this.fetchFn(
      this.url(`/purchase-requests/${requestId}/items`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<PurchaseRequestItemData>>(response);
  }

  /** POST /api/purchase-requests/[id]/items */
  async addItem(
    requestId: string,
    item: PurchaseRequestItemCreateInput
  ): Promise<ApiResponse<PurchaseRequestItemData>> {
    if (!requestId) throw new ApiClientError(400, 'Validation failed', 'requestId is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/${requestId}/items`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(item),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestItemData>>(response);
  }

  /** DELETE /api/purchase-requests/items/[id] */
  async removeItem(
    itemId: string
  ): Promise<ApiResponse<PurchaseRequestItemData> & { message: string }> {
    if (!itemId) throw new ApiClientError(400, 'Validation failed', 'itemId is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/items/${itemId}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestItemData> & { message: string }>(response);
  }

  /** PATCH /api/purchase-requests/items/[id]/receive — mark as received + warehouse tx */
  async receiveItem(
    itemId: string
  ): Promise<ApiResponse<PurchaseRequestItemData>> {
    if (!itemId) throw new ApiClientError(400, 'Validation failed', 'itemId is required');
    const response = await this.fetchFn(this.url(`/purchase-requests/items/${itemId}/receive`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PurchaseRequestItemData>>(response);
  }
}

/** Default singleton instance */
export const purchaseRequestsApi = new PurchaseRequestApiClient();

/** Convenience exports */
export const {
  getPurchaseRequests,
  groupBOM,
  getPurchaseRequest,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
  generateEmail,
  sendRequest,
  resendRequest,
  updateStatus,
  getItems,
  addItem,
  removeItem,
  receiveItem,
} = purchaseRequestsApi;

export default purchaseRequestsApi;
