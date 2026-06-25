/**
 * Interaction API Client
 *
 * TypeScript client for Interaction API with fetch wrapper.
 * Provides typed methods for CRUD operations on interactions.
 */

import type {
  InteractionData,
  InteractionFilters,
  InteractionCreateInput,
  InteractionUpdateInput,
  ApiListResponse,
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
 * Interaction API Client
 *
 * Provides typed methods for Interaction CRUD operations.
 * All methods return typed data or throw ApiClientError.
 */
export class InteractionApiClient {
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
   * GET /api/interactions
   *
   * List all interactions with optional filtering.
   * Supports filtering by contactId and type.
   *
   * @returns Array of interactions with count
   */
  async getInteractions(filters?: InteractionFilters): Promise<ApiListResponse<InteractionData>> {
    const response = await this.fetchFn(
      this.url('/interactions', {
        contactId: filters?.contactId,
        type: filters?.type,
      }),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<InteractionData>>(response);
  }

  /**
   * GET /api/interactions/[id]
   *
   * Fetch a single interaction by ID.
   *
   * @param id - Interaction UUID
   * @returns Interaction data
   * @throws ApiClientError with 404 if not found
   */
  async getInteraction(id: string): Promise<ApiResponse<InteractionData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/interactions/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<InteractionData>>(response);
  }

  /**
   * POST /api/interactions
   *
   * Create a new interaction.
   * Validates required fields: contactId, type, authorId.
   *
   * @param data - Interaction creation input
   * @returns Created interaction data
   * @throws ApiClientError with 400 on validation errors
   */
  async createInteraction(data: InteractionCreateInput): Promise<ApiResponse<InteractionData>> {
    const response = await this.fetchFn(this.url('/interactions'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<InteractionData>>(response);
  }

  /**
   * PUT /api/interactions/[id]
   *
   * Update an existing interaction.
   * Only provided fields are updated (partial update).
   *
   * @param id - Interaction UUID
   * @param data - Interaction update input (all fields optional)
   * @returns Updated interaction data
   * @throws ApiClientError with 404 if interaction not found
   */
  async updateInteraction(
    id: string,
    data: InteractionUpdateInput
  ): Promise<ApiResponse<InteractionData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/interactions/${id}`), {
      method: 'PUT',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<InteractionData>>(response);
  }

  /**
   * DELETE /api/interactions/[id]
   *
   * Hard delete an interaction.
   *
   * @param id - Interaction UUID
   * @returns Deleted interaction data with success message
   * @throws ApiClientError with 404 if interaction not found
   */
  async deleteInteraction(id: string): Promise<ApiResponse<InteractionData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/interactions/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<InteractionData> & { message: string }>(response);
  }

  /**
   * GET /api/contacts/[id]/interactions
   *
   * Fetch the interaction timeline for a specific contact.
   * Returns interactions ordered by createdAt descending with author info.
   *
   * @param contactId - Contact UUID
   * @returns Array of interactions with author data
   * @throws ApiClientError with 404 if contact doesn't exist
   */
  async getContactInteractions(contactId: string): Promise<ApiListResponse<InteractionData>> {
    if (!contactId) {
      throw new ApiClientError(400, 'Validation failed', 'contactId is required');
    }

    const response = await this.fetchFn(
      this.url(`/contacts/${contactId}/interactions`),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<InteractionData>>(response);
  }
}

/**
 * Default singleton instance for use across the application
 */
export const interactionsApi = new InteractionApiClient();

/**
 * Convenience exports for direct use
 */
export const {
  getInteractions,
  getInteraction,
  createInteraction,
  updateInteraction,
  deleteInteraction,
  getContactInteractions,
} = interactionsApi;

export default interactionsApi;
