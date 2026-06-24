/**
 * CashFlow Payment API Client
 *
 * TypeScript client for CashFlowPayment API with fetch wrapper.
 */

import type {
  CashFlowPaymentData,
  CashFlowPaymentListParams,
  CashFlowPaymentCreateInput,
  CashFlowPaymentUpdateInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class CashFlowPaymentApiClient {
  private baseUrl: string;
  private fetchFn: typeof globalThis.fetch;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = config.fetch ?? fetch;
    this.defaultHeaders = { 'Content-Type': 'application/json', ...config.headers };
  }

  private url(path: string, params?: Record<string, string | undefined>): string {
    const fullUrl = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) searchParams.append(key, value);
      }
      const qs = searchParams.toString();
      if (qs) return `${fullUrl}?${qs}`;
    }
    return fullUrl;
  }

  async getPayments(params?: CashFlowPaymentListParams): Promise<ApiListResponse<CashFlowPaymentData>> {
    const qp: Record<string, string | undefined> = {};
    if (params) for (const [k, v] of Object.entries(params)) { if (v !== undefined) qp[k] = String(v); }
    const response = await this.fetchFn(this.url('/cashflow-payments', qp), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<CashFlowPaymentData>>(response);
  }

  async getPayment(id: string): Promise<ApiResponse<CashFlowPaymentData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/cashflow-payments/${id}`), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<CashFlowPaymentData>>(response);
  }

  async createPayment(data: CashFlowPaymentCreateInput): Promise<ApiResponse<CashFlowPaymentData>> {
    const response = await this.fetchFn(this.url('/cashflow-payments'), {
      method: 'POST', headers: this.defaultHeaders, body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<CashFlowPaymentData>>(response);
  }

  async updatePayment(id: string, data: CashFlowPaymentUpdateInput): Promise<ApiResponse<CashFlowPaymentData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/cashflow-payments/${id}`), {
      method: 'PATCH', headers: this.defaultHeaders, body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<CashFlowPaymentData>>(response);
  }

  async deletePayment(id: string): Promise<ApiResponse<CashFlowPaymentData> & { message: string }> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/cashflow-payments/${id}`), {
      method: 'DELETE', headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<CashFlowPaymentData> & { message: string }>(response);
  }
}

export const cashflowPaymentsApi = new CashFlowPaymentApiClient();
export const { getPayments, getPayment, createPayment, updatePayment, deletePayment } = cashflowPaymentsApi;
export default cashflowPaymentsApi;
