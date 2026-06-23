/**
 * BOM API Client
 *
 * TypeScript client for BOM (Bill of Materials) API with fetch wrapper.
 * Provides typed methods for CRUD operations on BOM and BOMItem.
 */
import type {
  BOMData,
  BOMItemData,
  BOMListParams,
  BOMCreateInput,
  BOMUpdateInput,
  BOMItemCreateInput,
  BOMItemUpdateInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class BOMApiClient {
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
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        return `${fullUrl}?${queryString}`;
      }
    }

    return fullUrl;
  }

  /**
   * GET /api/bom?projectId=X
   *
   * Fetch BOM for a project. Returns single BOM since projectId is unique.
   */
  async getBOM(projectId: string): Promise<ApiResponse<BOMData>> {
    if (!projectId) {
      throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    }

    const response = await this.fetchFn(
      this.url('/bom', { projectId }),
      { headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMData>>(response);
  }

  /**
   * GET /api/bom/[id]
   *
   * Fetch a single BOM by its ID.
   */
  async getBOMById(id: string): Promise<ApiResponse<BOMData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/${id}`),
      { headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMData>>(response);
  }

  /**
   * POST /api/bom
   *
   * Create a new BOM for a project.
   */
  async createBOM(data: BOMCreateInput): Promise<ApiResponse<BOMData>> {
    const response = await this.fetchFn(
      this.url('/bom'),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMData>>(response);
  }

  /**
   * PATCH /api/bom/[id]
   *
   * Update BOM status or sourceFileId.
   */
  async updateBOM(id: string, data: BOMUpdateInput): Promise<ApiResponse<BOMData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/${id}`),
      {
        method: 'PATCH',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMData>>(response);
  }

  /**
   * DELETE /api/bom/[id]
   *
   * Delete a BOM and all its items (cascade).
   */
  async deleteBOM(id: string): Promise<ApiResponse<BOMData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/${id}`),
      { method: 'DELETE', headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMData> & { message: string }>(response);
  }

  /**
   * POST /api/bom/[id]/lock
   *
   * Lock a BOM so it cannot be edited.
   */
  async lockBOM(id: string): Promise<ApiResponse<BOMData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/${id}/lock`),
      { method: 'POST', headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMData>>(response);
  }

  /**
   * POST /api/bom/[id]/unlock
   *
   * Unlock a BOM to allow edits.
   */
  async unlockBOM(id: string): Promise<ApiResponse<BOMData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/${id}/unlock`),
      { method: 'POST', headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMData>>(response);
  }

  /**
   * GET /api/bom/[bomId]/items
   *
   * Get all items for a BOM.
   */
  async getBOMItems(bomId: string): Promise<ApiListResponse<BOMItemData>> {
    if (!bomId) {
      throw new ApiClientError(400, 'Validation failed', 'bomId is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/${bomId}/items`),
      { headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<BOMItemData>>(response);
  }

  /**
   * POST /api/bom/[bomId]/items
   *
   * Add items to a BOM.
   */
  async addBOMItems(
    bomId: string,
    items: BOMItemCreateInput[]
  ): Promise<ApiListResponse<BOMItemData>> {
    if (!bomId) {
      throw new ApiClientError(400, 'Validation failed', 'bomId is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/${bomId}/items`),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({ items }),
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<BOMItemData>>(response);
  }

  /**
   * PATCH /api/bom/items/[id]
   *
   * Update a single BOM item.
   */
  async updateBOMItem(
    id: string,
    data: BOMItemUpdateInput
  ): Promise<ApiResponse<BOMItemData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/items/${id}`),
      {
        method: 'PATCH',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMItemData>>(response);
  }

  /**
   * DELETE /api/bom/items/[id]
   *
   * Delete a single BOM item.
   */
  async deleteBOMItem(id: string): Promise<ApiResponse<BOMItemData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/bom/items/${id}`),
      { method: 'DELETE', headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<BOMItemData> & { message: string }>(response);
  }
}

/**
 * Default singleton instance for use across the application
 */
export const bomApi = new BOMApiClient();

/**
 * Convenience exports for direct use
 */
export const {
  getBOM,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  lockBOM,
  unlockBOM,
  getBOMItems,
  addBOMItems,
  updateBOMItem,
  deleteBOMItem,
} = bomApi;

export default bomApi;
