/**
 * Production API Client
 *
 * TypeScript client for Production API with fetch wrapper.
 * Provides typed methods for CRUD operations on productions and production stages.
 */

import type {
  ProductionData,
  ProductionStageData,
  ProductionCreateInput,
  ProductionUpdateInput,
  ProductionStageCreateInput,
  ProductionStageUpdateInput,
  ProductionStageMoveInput,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

/**
 * Default base URL for API requests
 */
const DEFAULT_BASE_URL = '/api';

/**
 * Production API Client
 *
 * Provides typed methods for Production and ProductionStage CRUD operations.
 */
export class ProductionApiClient {
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

  /**
   * Build full URL for endpoint
   */
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
   * GET /api/projects/[projectId]/productions
   *
   * List all productions for a project with stages.
   */
  async getProductions(projectId: string): Promise<ApiResponse<ProductionData[]>> {
    if (!projectId) {
      throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    }

    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/productions`),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionData[]>>(response);
  }

  /**
   * GET /api/productions/[id]
   *
   * Fetch a single production by ID with stages.
   */
  async getProduction(id: string): Promise<ApiResponse<ProductionData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/productions/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionData>>(response);
  }

  /**
   * POST /api/projects/[projectId]/productions
   *
   * Create a new production for a project.
   */
  async createProduction(
    projectId: string,
    data: Omit<ProductionCreateInput, 'projectId'>
  ): Promise<ApiResponse<ProductionData>> {
    if (!projectId) {
      throw new ApiClientError(400, 'Validation failed', 'projectId is required');
    }

    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/productions`),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionData>>(response);
  }

  /**
   * PATCH /api/productions/[id]
   *
   * Update an existing production.
   */
  async updateProduction(
    id: string,
    data: ProductionUpdateInput
  ): Promise<ApiResponse<ProductionData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/productions/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionData>>(response);
  }

  /**
   * DELETE /api/productions/[id]
   *
   * Soft-delete a production.
   */
  async deleteProduction(id: string): Promise<ApiResponse<ProductionData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/productions/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionData>>(response);
  }

  /**
   * GET /api/productions/[productionId]/stages
   *
   * List all stages for a production.
   */
  async getStages(productionId: string): Promise<ApiResponse<ProductionStageData[]>> {
    if (!productionId) {
      throw new ApiClientError(400, 'Validation failed', 'productionId is required');
    }

    const response = await this.fetchFn(
      this.url(`/productions/${productionId}/stages`),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionStageData[]>>(response);
  }

  /**
   * POST /api/productions/[productionId]/stages
   *
   * Create a new stage for a production.
   */
  async createStage(
    productionId: string,
    data: Omit<ProductionStageCreateInput, 'productionId'>
  ): Promise<ApiResponse<ProductionStageData>> {
    if (!productionId) {
      throw new ApiClientError(400, 'Validation failed', 'productionId is required');
    }

    const response = await this.fetchFn(
      this.url(`/productions/${productionId}/stages`),
      {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionStageData>>(response);
  }

  /**
   * PATCH /api/stages/[id]
   *
   * Update an existing production stage.
   */
  async updateStage(
    id: string,
    data: ProductionStageUpdateInput
  ): Promise<ApiResponse<ProductionStageData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/stages/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionStageData>>(response);
  }

  /**
   * DELETE /api/stages/[id]
   *
   * Delete a production stage (hard delete).
   */
  async deleteStage(id: string): Promise<ApiResponse<ProductionStageData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/stages/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionStageData>>(response);
  }

  /**
   * PATCH /api/stages/[id]/move
   *
   * Move a production stage to a different status.
   * Uses the standard updateStage endpoint with status change.
   */
  async moveStage(
    id: string,
    data: ProductionStageMoveInput
  ): Promise<ApiResponse<ProductionStageData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/stages/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProductionStageData>>(response);
  }
}

/**
 * Default singleton instance
 */
export const productionsApi = new ProductionApiClient();

/**
 * Convenience exports
 */
export const {
  getProductions,
  getProduction,
  createProduction,
  updateProduction,
  deleteProduction,
  getStages,
  createStage,
  updateStage,
  deleteStage,
  moveStage,
} = productionsApi;

export default productionsApi;
