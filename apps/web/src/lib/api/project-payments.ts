/**
 * ProjectPayment API Client (FIN-01)
 *
 * Typed client for client payment stages (70/30) tied to a project:
 * list/create + record payment + coverage.
 */

import type {
  ProjectPaymentData,
  ProjectPaymentCreateInput,
  RecordPaymentInput,
  PaymentCoverage,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class ProjectPaymentApiClient {
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

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /** GET /api/projects/[projectId]/payments (auto-creates 70/30 if missing) */
  async getPayments(projectId: string): Promise<ApiListResponse<ProjectPaymentData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/payments`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<ProjectPaymentData>>(response);
  }

  /** GET /api/projects/[projectId]/payments/coverage */
  async getCoverage(projectId: string): Promise<ApiResponse<PaymentCoverage>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/payments/coverage`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<PaymentCoverage>>(response);
  }

  /** POST /api/projects/[projectId]/payments */
  async createPayment(
    projectId: string,
    data: ProjectPaymentCreateInput
  ): Promise<ApiResponse<ProjectPaymentData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/payments`),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ProjectPaymentData>>(response);
  }

  /** POST /api/project-payments/[id]/record */
  async recordPayment(id: string, data: RecordPaymentInput): Promise<ApiResponse<ProjectPaymentData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/project-payments/${id}/record`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ProjectPaymentData>>(response);
  }
}

export const projectPaymentsApi = new ProjectPaymentApiClient();

export const {
  getPayments: getProjectPayments,
  getCoverage: getPaymentCoverage,
  createPayment: createProjectPayment,
  recordPayment: recordProjectPayment,
} = projectPaymentsApi;

export default projectPaymentsApi;
