/**
 * Installation API Client (PROJ-10)
 *
 * Typed client for progressive installation tracking:
 * CRUD + status transitions + worker management.
 */

import type {
  InstallationData,
  InstallationCreateInput,
  InstallationUpdateInput,
  InstallationStatusType,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class InstallationApiClient {
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

  /** GET /api/projects/[projectId]/installations */
  async getInstallations(projectId: string): Promise<ApiListResponse<InstallationData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/installations`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<InstallationData>>(response);
  }

  /** GET /api/installations/[id] */
  async getInstallation(id: string): Promise<ApiResponse<InstallationData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/installations/${id}`), { headers: this.defaultHeaders });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InstallationData>>(response);
  }

  /** POST /api/projects/[projectId]/installations */
  async createInstallation(
    projectId: string,
    data: InstallationCreateInput
  ): Promise<ApiResponse<InstallationData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/installations`),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InstallationData>>(response);
  }

  /** PATCH /api/installations/[id] */
  async updateInstallation(
    id: string,
    data: InstallationUpdateInput
  ): Promise<ApiResponse<InstallationData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/installations/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InstallationData>>(response);
  }

  /** DELETE /api/installations/[id] */
  async deleteInstallation(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/installations/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<{ deleted: boolean }>>(response);
  }

  /** PATCH /api/installations/[id]/status */
  async updateStatus(
    id: string,
    status: InstallationStatusType
  ): Promise<ApiResponse<InstallationData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/installations/${id}/status`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<InstallationData>>(response);
  }
}

export const installationsApi = new InstallationApiClient();

export const {
  getInstallations,
  getInstallation,
  createInstallation,
  updateInstallation,
  deleteInstallation,
  updateStatus,
} = installationsApi;

export default installationsApi;
