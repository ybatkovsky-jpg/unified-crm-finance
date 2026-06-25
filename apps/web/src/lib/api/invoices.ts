/**
 * Invoice API Client (S04 — manual MVP)
 *
 * Typed client for the Invoice API (PROC-23..PROC-27, minus AI/IMAP).
 * CRUD + manual item matching + reconciliation + status transitions.
 */
import type {
  InvoiceData,
  InvoiceItemData,
  InvoiceListParams,
  InvoiceCreateInput,
  InvoiceItemCreateInput,
  InvoiceItemUpdateInput,
  InvoiceStatus,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class InvoiceApiClient {
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

  /** GET /api/invoices — list with optional filters */
  async getInvoices(params: InvoiceListParams = {}): Promise<ApiListResponse<InvoiceData>> {
    const response = await this.fetchFn(
      this.url('/invoices', {
        projectId: params.projectId,
        supplierId: params.supplierId,
        status: params.status,
      }),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<InvoiceData>>(response);
  }

  /** GET /api/invoices/[id] */
  async getInvoice(id: string): Promise<ApiResponse<InvoiceData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/invoices/${id}`), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceData>>(response);
  }

  /** POST /api/invoices — create (manual upload, PROC-27) */
  async createInvoice(data: InvoiceCreateInput): Promise<ApiResponse<InvoiceData>> {
    const response = await this.fetchFn(this.url('/invoices'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceData>>(response);
  }

  /** PATCH /api/invoices/[id] — update metadata */
  async updateInvoice(id: string, data: Partial<InvoiceCreateInput>): Promise<ApiResponse<InvoiceData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/invoices/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceData>>(response);
  }

  /** DELETE /api/invoices/[id] */
  async deleteInvoice(id: string): Promise<ApiResponse<InvoiceData> & { message: string }> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/invoices/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceData> & { message: string }>(response);
  }

  /** GET /api/invoices/[id]/items */
  async getItems(invoiceId: string): Promise<ApiListResponse<InvoiceItemData>> {
    if (!invoiceId) throw new ApiClientError(400, 'Validation failed', 'invoiceId is required');
    const response = await this.fetchFn(this.url(`/invoices/${invoiceId}/items`), {
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<InvoiceItemData>>(response);
  }

  /** POST /api/invoices/[id]/items */
  async addItem(
    invoiceId: string,
    item: InvoiceItemCreateInput
  ): Promise<ApiResponse<InvoiceItemData>> {
    if (!invoiceId) throw new ApiClientError(400, 'Validation failed', 'invoiceId is required');
    const response = await this.fetchFn(this.url(`/invoices/${invoiceId}/items`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(item),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceItemData>>(response);
  }

  /** PATCH /api/invoices/items/[id] */
  async updateItem(
    itemId: string,
    data: InvoiceItemUpdateInput
  ): Promise<ApiResponse<InvoiceItemData>> {
    if (!itemId) throw new ApiClientError(400, 'Validation failed', 'itemId is required');
    const response = await this.fetchFn(this.url(`/invoices/items/${itemId}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceItemData>>(response);
  }

  /** DELETE /api/invoices/items/[id] */
  async removeItem(itemId: string): Promise<ApiResponse<InvoiceItemData> & { message: string }> {
    if (!itemId) throw new ApiClientError(400, 'Validation failed', 'itemId is required');
    const response = await this.fetchFn(this.url(`/invoices/items/${itemId}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceItemData> & { message: string }>(response);
  }

  /** POST /api/invoices/items/[id]/match — match an invoice line to a BOMItem (PROC-24) */
  async matchItem(itemId: string, bomItemId: string): Promise<ApiResponse<InvoiceItemData>> {
    if (!itemId) throw new ApiClientError(400, 'Validation failed', 'itemId is required');
    const response = await this.fetchFn(this.url(`/invoices/items/${itemId}/match`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ bomItemId }),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceItemData>>(response);
  }

  /** POST /api/invoices/items/[id]/unmatch */
  async unmatchItem(itemId: string): Promise<ApiResponse<InvoiceItemData>> {
    if (!itemId) throw new ApiClientError(400, 'Validation failed', 'itemId is required');
    const response = await this.fetchFn(this.url(`/invoices/items/${itemId}/unmatch`), {
      method: 'POST',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceItemData>>(response);
  }

  /** POST /api/invoices/[id]/recompute — recompute status from match state (PROC-23) */
  async recomputeStatus(invoiceId: string): Promise<ApiResponse<InvoiceData>> {
    if (!invoiceId) throw new ApiClientError(400, 'Validation failed', 'invoiceId is required');
    const response = await this.fetchFn(this.url(`/invoices/${invoiceId}/recompute`), {
      method: 'POST',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceData>>(response);
  }

  /** POST /api/invoices/[id]/approve — approve (PROC-25) */
  async approveInvoice(invoiceId: string): Promise<ApiResponse<InvoiceData>> {
    if (!invoiceId) throw new ApiClientError(400, 'Validation failed', 'invoiceId is required');
    const response = await this.fetchFn(this.url(`/invoices/${invoiceId}/approve`), {
      method: 'POST',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceData>>(response);
  }

  /** POST /api/invoices/[id]/pay — pay invoice (creates Transaction + CashFlowPayment) */
  async payInvoice(
    invoiceId: string,
    data?: { amount?: number; date?: string; description?: string; categoryId?: string }
  ): Promise<ApiResponse<unknown>> {
    if (!invoiceId) throw new ApiClientError(400, 'Validation failed', 'invoiceId is required');
    const response = await this.fetchFn(this.url(`/invoices/${invoiceId}/pay`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data ?? {}),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<unknown>>(response);
  }

  /** PATCH /api/invoices/[id]/status — explicit status transition */
  async updateStatus(invoiceId: string, status: InvoiceStatus): Promise<ApiResponse<InvoiceData>> {
    if (!invoiceId) throw new ApiClientError(400, 'Validation failed', 'invoiceId is required');
    const response = await this.fetchFn(this.url(`/invoices/${invoiceId}/status`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InvoiceData>>(response);
  }
}

/** Default singleton instance */
export const invoicesApi = new InvoiceApiClient();

/** Convenience exports */
export const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getItems,
  addItem,
  updateItem,
  removeItem,
  matchItem,
  unmatchItem,
  recomputeStatus,
  approveInvoice,
  payInvoice,
  updateStatus,
} = invoicesApi;

export default invoicesApi;
