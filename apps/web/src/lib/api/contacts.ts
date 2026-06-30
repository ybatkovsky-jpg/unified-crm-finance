/**
 * Contact API Client
 *
 * TypeScript client for Contact API with fetch wrapper.
 * Provides typed methods for CRUD operations on contacts.
 */

import type {
  ContactData,
  ContactListParams,
  ContactCreateInput,
  ContactUpdateInput,
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
 * Contact API Client
 *
 * Provides typed methods for Contact CRUD operations.
 * All methods return typed data or throw ApiClientError.
 */
export class ContactApiClient {
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
   * GET /api/contacts
   *
   * List all contacts with optional filtering.
   * Supports filtering by type and status.
   *
   * @returns Array of contacts with count
   */
  async getContacts(params?: ContactListParams): Promise<ApiListResponse<ContactData>> {
    const response = await this.fetchFn(
      this.url('/contacts', {
        type: params?.type,
        status: params?.status,
        companyId: params?.companyId,
      }),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<ContactData>>(response);
  }

  /**
   * GET /api/contacts/[id]
   *
   * Fetch a single contact by ID.
   *
   * @param id - Contact UUID
   * @returns Contact data
   * @throws ApiClientError with 404 if not found
   */
  async getContact(id: string): Promise<ApiResponse<ContactData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/contacts/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ContactData>>(response);
  }

  /**
   * POST /api/contacts
   *
   * Create a new contact.
   * Validates required fields based on contact type.
   *
   * @param data - Contact creation input
   * @returns Created contact data
   * @throws ApiClientError with 400 on validation errors
   */
  async createContact(data: ContactCreateInput): Promise<ApiResponse<ContactData>> {
    const response = await this.fetchFn(this.url('/contacts'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ContactData>>(response);
  }

  /**
   * PUT /api/contacts/[id]
   *
   * Update an existing contact.
   * Only provided fields are updated (partial update).
   *
   * @param id - Contact UUID
   * @param data - Contact update input (all fields optional)
   * @returns Updated contact data
   * @throws ApiClientError with 404 if contact not found
   */
  async updateContact(
    id: string,
    data: ContactUpdateInput
  ): Promise<ApiResponse<ContactData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/contacts/${id}`), {
      method: 'PUT',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ContactData>>(response);
  }

  /**
   * DELETE /api/contacts/[id]
   *
   * Soft-delete a contact by setting deletedAt timestamp.
   * Contact remains in database but is filtered from queries.
   *
   * @param id - Contact UUID
   * @returns Deleted contact data with success message
   * @throws ApiClientError with 404 if contact not found
   */
  async deleteContact(id: string): Promise<ApiResponse<ContactData> & { message: string }> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/contacts/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ContactData> & { message: string }>(response);
  }
}

/**
 * Default singleton instance for use across the application
 */
export const contactsApi = new ContactApiClient();

/**
 * Convenience exports for direct use
 */
export const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} = contactsApi;

export default contactsApi;
