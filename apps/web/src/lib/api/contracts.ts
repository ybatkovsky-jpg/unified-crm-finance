/**
 * Contract API Client
 *
 * TypeScript client for Contract API with fetch wrapper.
 * Provides typed methods for CRUD operations on contracts.
 */

import type {
  ContractData,
  DealData,
  ContractListParams,
  ContractCreateInput,
  ContractUpdateInput,
  ContractVersionCreateInput,
  ContractSignerCreateInput,
  DealConvertInput,
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
 * Contract API Client
 */
export class ContractApiClient {
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
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      }
      const queryString = searchParams.toString();
      if (queryString) return `${fullUrl}?${queryString}`;
    }
    return fullUrl;
  }

  async getContracts(params?: ContractListParams): Promise<ApiListResponse<ContractData>> {
    const response = await this.fetchFn(
      this.url('/contracts', {
        status: params?.status,
        contactId: params?.contactId,
        dealId: params?.dealId,
      }),
      { headers: this.defaultHeaders }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<ContractData>>(response);
  }

  async getContract(id: string): Promise<ApiResponse<ContractData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/contracts/${id}`), {
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ContractData>>(response);
  }

  async createContract(data: ContractCreateInput): Promise<ApiResponse<ContractData>> {
    const response = await this.fetchFn(this.url('/contracts'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ContractData>>(response);
  }

  async updateContract(
    id: string,
    data: ContractUpdateInput
  ): Promise<ApiResponse<ContractData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/contracts/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ContractData>>(response);
  }

  async deleteContract(id: string): Promise<ApiResponse<ContractData>> {
    if (!id) throw new ApiClientError(400, 'Validation failed', 'id is required');
    const response = await this.fetchFn(this.url(`/contracts/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ContractData>>(response);
  }

  async getVersions(id: string): Promise<ApiListResponse<any>> {
    const response = await this.fetchFn(this.url(`/contracts/${id}/versions`), {
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<any>>(response);
  }

  async addVersion(id: string, data: ContractVersionCreateInput): Promise<ApiResponse<any>> {
    const response = await this.fetchFn(this.url(`/contracts/${id}/versions`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<any>>(response);
  }

  async getSigners(id: string): Promise<ApiListResponse<any>> {
    const response = await this.fetchFn(this.url(`/contracts/${id}/signers`), {
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiListResponse<any>>(response);
  }

  async addSigner(id: string, data: ContractSignerCreateInput): Promise<ApiResponse<any>> {
    const response = await this.fetchFn(this.url(`/contracts/${id}/signers`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<any>>(response);
  }

  async convertDeal(id: string, data: DealConvertInput): Promise<ApiResponse<{ contract: ContractData; deal: DealData }>> {
    const response = await this.fetchFn(this.url(`/deals/${id}/convert`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<{ contract: ContractData; deal: DealData }>>(response);
  }
}

export const contractsApi = new ContractApiClient();

export const {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getVersions,
  addVersion,
  getSigners,
  addSigner,
  convertDeal,
} = contractsApi;

export default contractsApi;
