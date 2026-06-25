/**
 * Pipeline API Client
 *
 * TypeScript client for Pipeline API with fetch wrapper.
 * Provides typed methods for listing pipelines and fetching pipeline details.
 */

import type {
  PipelineData,
  DealStageData,
  ApiListResponse,
  ApiResponse,
  ApiClientConfig,
} from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

/**
 * Pipeline with its stages included
 */
export interface PipelineWithStages extends PipelineData {
  DealStage: DealStageData[];
}

const DEFAULT_BASE_URL = '/api';

export class PipelineApiClient {
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
      if (queryString) {
        return `${fullUrl}?${queryString}`;
      }
    }

    return fullUrl;
  }

  /**
   * GET /api/pipelines
   *
   * List all active pipelines.
   */
  async getPipelines(): Promise<ApiListResponse<PipelineData>> {
    const response = await this.fetchFn(this.url('/pipelines'), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<PipelineData>>(response);
  }

  /**
   * GET /api/pipelines/[id]
   *
   * Fetch a single pipeline with its stages, sorted by order.
   *
   * @throws ApiClientError with 400 if id is empty
   * @throws ApiClientError with 404 if not found
   */
  async getPipeline(id: string): Promise<ApiResponse<PipelineWithStages>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/pipelines/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<PipelineWithStages>>(response);
  }
}

/**
 * Default singleton instance
 */
export const pipelinesApi = new PipelineApiClient();

/**
 * Convenience exports
 */
export const { getPipelines, getPipeline } = pipelinesApi;

export default pipelinesApi;
