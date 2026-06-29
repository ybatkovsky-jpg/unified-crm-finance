/**
 * Project API Client
 *
 * TypeScript client for Project API with fetch wrapper.
 * Provides typed methods for CRUD operations on projects.
 */

import type {
  ProjectData,
  ProjectStageData,
  ProjectListParams,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectStageUpdateInput,
  ClosureReadiness,
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
 * Project API Client
 *
 * Provides typed methods for Project CRUD operations.
 */
export class ProjectApiClient {
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
   * GET /api/projects
   *
   * List all projects with optional filtering.
   */
  async getProjects(params?: ProjectListParams): Promise<ApiListResponse<ProjectData>> {
    const response = await this.fetchFn(
      this.url('/projects', {
        status: params?.status,
        managerId: params?.managerId,
        contactId: params?.contactId,
        dealId: params?.dealId,
        skip: params?.skip?.toString(),
        take: params?.take?.toString(),
      }),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiListResponse<ProjectData>>(response);
  }

  /**
   * GET /api/projects/[id]
   *
   * Fetch a single project by ID.
   */
  async getProject(id: string): Promise<ApiResponse<ProjectData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/projects/${id}`), {
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProjectData>>(response);
  }

  /**
   * POST /api/projects
   *
   * Create a new project.
   */
  async createProject(data: ProjectCreateInput): Promise<ApiResponse<ProjectData>> {
    const response = await this.fetchFn(this.url('/projects'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProjectData>>(response);
  }

  /**
   * PATCH /api/projects/[id]
   *
   * Update an existing project.
   */
  async updateProject(
    id: string,
    data: ProjectUpdateInput
  ): Promise<ApiResponse<ProjectData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/projects/${id}`), {
      method: 'PATCH',
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProjectData>>(response);
  }

  /**
   * DELETE /api/projects/[id]
   *
   * Soft-delete a project.
   */
  async deleteProject(id: string): Promise<ApiResponse<ProjectData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(this.url(`/projects/${id}`), {
      method: 'DELETE',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProjectData>>(response);
  }

  /**
   * PATCH /api/projects/[id]/stages/[stageId]
   *
   * Update a project stage's dates via drag-drop.
   */
  async updateStage(
    projectId: string,
    stageId: string,
    data: ProjectStageUpdateInput
  ): Promise<ApiResponse<ProjectStageData>> {
    if (!projectId || !stageId) {
      throw new ApiClientError(400, 'Validation failed', 'projectId and stageId are required');
    }

    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/stages/${stageId}`),
      {
        method: 'PATCH',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<ProjectStageData>>(response);
  }

  /**
   * POST /api/projects/[id]/complete
   *
   * Complete a project and cascade the completion to the related Deal.
   * Validates all project stages are completed first.
   * Checks closure readiness (PROJ-13); set `overrideUnmet` to force-close
   * even if conditions (act/money/invoices/bonus) are unmet.
   * Records a 2-year warranty period on completion (PROJ-14).
   */
  async completeProject(
    id: string,
    userId: string,
    overrideUnmet: boolean = false
  ): Promise<ApiResponse<{ project: ProjectData; deal: ProjectData['deal'] | null; readiness: ClosureReadiness }>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }
    if (!userId) {
      throw new ApiClientError(400, 'Validation failed', 'userId is required');
    }

    const response = await this.fetchFn(this.url(`/projects/${id}/complete`), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ userId, overrideUnmet }),
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<{ project: ProjectData; deal: ProjectData['deal'] | null; readiness: ClosureReadiness }>>(response);
  }

  /**
   * GET /api/projects/[id]/closure-readiness
   *
   * Returns the PROJ-13 closure readiness checklist (act/money/invoices/bonus).
   */
  async getClosureReadiness(id: string): Promise<ApiResponse<ClosureReadiness>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }
    const response = await this.fetchFn(this.url(`/projects/${id}/closure-readiness`), {
      headers: this.defaultHeaders,
    });
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ClosureReadiness>>(response);
  }

  /** PATCH /api/projects/[id]/stages/[stageId] — update stage status/dates */
  async updateProjectStage(
    projectId: string,
    stageId: string,
    data: { status?: string; startDate?: string; endDate?: string; completedAt?: string }
  ): Promise<ApiResponse<ProjectStageData>> {
    if (!projectId || !stageId) {
      throw new ApiClientError(400, 'Validation failed', 'projectId and stageId are required');
    }
    const response = await this.fetchFn(
      this.url(`/projects/${projectId}/stages/${stageId}`),
      {
        method: 'PATCH',
        headers: this.defaultHeaders,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) return parseApiError(response);
    return parseJson<ApiResponse<ProjectStageData>>(response);
  }
}

/**
 * Default singleton instance
 */
export const projectsApi = new ProjectApiClient();

/**
 * Convenience exports
 */
export const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateStage,
  completeProject,
  getClosureReadiness,
} = projectsApi;

export default projectsApi;
