/**
 * AcceptanceAct API Client (PROJ-12)
 *
 * Typed client for the project acceptance act (1:1 to project):
 * get/create + update + sign.
 */

import type {
  AcceptanceActData,
  AcceptanceActCreateInput,
  AcceptanceActUpdateInput,
  SignActInput,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class AcceptanceActApiClient {
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

  /** GET /api/projects/[projectId]/acceptance-act */
  async getAcceptanceAct(projectId: string): Promise<ApiResponse<AcceptanceActData | null>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/acceptance-act`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<AcceptanceActData | null>>(response);
  }

  /** POST /api/projects/[projectId]/acceptance-act (create-or-return) */
  async createAcceptanceAct(
    projectId: string,
    data: AcceptanceActCreateInput = {}
  ): Promise<ApiResponse<AcceptanceActData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/acceptance-act`),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<AcceptanceActData>>(response);
  }

  /** PATCH /api/acceptance-acts/[id] */
  async updateAcceptanceAct(
    id: string,
    data: AcceptanceActUpdateInput
  ): Promise<ApiResponse<AcceptanceActData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/acceptance-acts/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<AcceptanceActData>>(response);
  }

  /** PATCH /api/acceptance-acts/[id]/sign */
  async signAcceptanceAct(id: string, data: SignActInput): Promise<ApiResponse<AcceptanceActData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    if (!data.signedById) throw new ApiClientError(400, 'Validation failed', 'signedById is required');
    const response = await this.fetchFn(this.url(`/acceptance-acts/${id}/sign`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<AcceptanceActData>>(response);
  }

  /** DELETE /api/acceptance-acts/[id] */
  async deleteAcceptanceAct(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/acceptance-acts/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<{ deleted: boolean }>>(response);
  }
}

export const acceptanceActsApi = new AcceptanceActApiClient();

export const {
  getAcceptanceAct,
  createAcceptanceAct,
  updateAcceptanceAct,
  signAcceptanceAct,
  deleteAcceptanceAct,
} = acceptanceActsApi;

export default acceptanceActsApi;
