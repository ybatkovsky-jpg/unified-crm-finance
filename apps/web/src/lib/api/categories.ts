/**
 * Category API Client
 *
 * TypeScript client for Category API with fetch wrapper.
 * Provides typed methods for CRUD operations on categories.
 */

import type {
  CategoryData,
  CategoryListParams,
  CategoryCreateInput,
  CategoryUpdateInput,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

const DEFAULT_BASE_URL = '/api';

export class CategoryApiClient {
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
   * GET /api/categories
   *
   * List categories with optional filters: type, isActive, includeInactive.
   * Returns flat list sorted by parentId (nulls first), then order.
   */
  async getCategories(params?: CategoryListParams): Promise<ApiListResponse<CategoryData>> {
    const queryParams: Record<string, string | undefined> = {};

    if (params?.type) queryParams.type = params.type;
    if (params?.isActive !== undefined) queryParams.isActive = String(params.isActive);
    if (params?.includeInactive !== undefined) queryParams.includeInactive = String(params.includeInactive);

    const response = await this.fetchFn(
      this.url('/categories', queryParams),
      { headers: this.defaultHeaders }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<CategoryData>>(response);
  }

  /**
   * GET /api/categories/[id]
   *
   * Fetch a single active category by ID.
   *
   * @param id - Category UUID
   * @returns Category data
   * @throws ApiClientError with 404 if not found
   */
  async getCategory(id: string): Promise<ApiResponse<CategoryData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/categories/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CategoryData>>(response);
  }

  /**
   * POST /api/categories
   *
   * Create a new category.
   *
   * @param data - Category creation input
   * @returns Created category data (status 201)
   * @throws ApiClientError with 400 on validation errors (missing name, invalid type, bad parentId)
   */
  async createCategory(data: CategoryCreateInput): Promise<ApiResponse<CategoryData>> {
    const response = await this.fetchFn(this.url('/categories'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CategoryData>>(response);
  }

  /**
   * PATCH /api/categories/[id]
   *
   * Update an existing category (partial update).
   * Only provided fields are changed.
   *
   * @param id - Category UUID
   * @param data - Category update input (all fields optional)
   * @returns Updated category data
   * @throws ApiClientError with 404 if category not found, 400 on validation errors
   */
  async updateCategory(
    id: string,
    data: CategoryUpdateInput
  ): Promise<ApiResponse<CategoryData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/categories/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CategoryData>>(response);
  }

  /**
   * DELETE /api/categories/[id]
   *
   * Soft-delete a category by setting isActive = false.
   * Refuses if category is referenced by Budget or Transaction records.
   *
   * @param id - Category UUID
   * @returns Deactivated category data with success message
   * @throws ApiClientError with 404 if not found, 409 if referenced
   */
  async deleteCategory(id: string): Promise<ApiResponse<CategoryData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/categories/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<CategoryData> & { message: string }>(response);
  }
}

/** Default singleton instance */
export const categoriesApi = new CategoryApiClient();

/** Convenience exports for direct use */
export const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = categoriesApi;

export default categoriesApi;
