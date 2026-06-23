/**
 * ApprovalRequest API Client (S05)
 *
 * Typed client for the payment-approval API (PROC-28..PROC-31).
 */
import type {
  ApprovalRequestData,
  ApprovalListParams,
  ApprovalCreateInput,
  ApprovalDecisionInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class ApprovalRequestApiClient {
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

  /** GET /api/approvals — list with optional status/type filters */
  async getApprovals(params: ApprovalListParams = {}): Promise<ApiListResponse<ApprovalRequestData>> {
    const response = await this.fetchFn(
      this.url('/approvals', { status: params.status, type: params.type }),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<ApprovalRequestData>>(response);
  }

  /** GET /api/approvals/[id] */
  async getApproval(id: string): Promise<ApiResponse<ApprovalRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/approvals/${id}`), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ApprovalRequestData>>(response);
  }

  /** POST /api/approvals — create (PROC-28) */
  async createApproval(data: ApprovalCreateInput): Promise<ApiResponse<ApprovalRequestData>> {
    const response = await this.fetchFn(this.url('/approvals'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ApprovalRequestData>>(response);
  }

  /** POST /api/approvals/[id]/decide — approve/reject (PROC-30) */
  async decideApproval(id: string, input: ApprovalDecisionInput): Promise<ApiResponse<ApprovalRequestData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/approvals/${id}/decide`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(input),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ApprovalRequestData>>(response);
  }
}

/** Default singleton instance */
export const approvalsApi = new ApprovalRequestApiClient();

/** Convenience exports */
export const { getApprovals, getApproval, createApproval, decideApproval } = approvalsApi;

export default approvalsApi;
