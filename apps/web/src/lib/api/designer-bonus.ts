/**
 * DesignerBonus API Client (минимальный след, PROJ-13)
 *
 * Typed client for the per-project designer bonus (1:1): get/upsert + mark-paid.
 */

import type {
  DesignerBonusData,
  DesignerBonusUpsertInput,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class DesignerBonusApiClient {
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

  /** GET /api/projects/[projectId]/designer-bonus */
  async getDesignerBonus(projectId: string): Promise<ApiResponse<DesignerBonusData | null>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/designer-bonus`),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<DesignerBonusData | null>>(response);
  }

  /** PUT /api/projects/[projectId]/designer-bonus (upsert) */
  async upsertDesignerBonus(
    projectId: string,
    data: DesignerBonusUpsertInput
  ): Promise<ApiResponse<DesignerBonusData>> {
    if (!projectId) throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/designer-bonus`),
      {
        method: 'PUT',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<DesignerBonusData>>(response);
  }

  /** PATCH /api/designer-bonuses/[id]/mark-paid */
  async markPaid(id: string): Promise<ApiResponse<DesignerBonusData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/designer-bonuses/${id}/mark-paid`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<DesignerBonusData>>(response);
  }
}

export const designerBonusesApi = new DesignerBonusApiClient();

export const {
  getDesignerBonus,
  upsertDesignerBonus,
  markPaid: markDesignerBonusPaid,
} = designerBonusesApi;

export default designerBonusesApi;
