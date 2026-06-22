/**
 * Project API Client Tests
 *
 * Tests for ProjectApiClient with mocked fetch.
 * Run with: npx tsx --test src/lib/api/projects.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ProjectApiClient, ApiClientError, projectsApi } from './projects';
import type { ProjectData, ProjectCreateInput, ProjectUpdateInput } from './types';

// ── Mock factories ──────────────────────────────────────────────────

function mockStage(overrides: Partial<ProjectData['stage']> = {}): ProjectData['stage'] {
  return {
    id: 'stage-id',
    code: 'lead',
    name: 'Lead',
    order: 1,
    isActive: true,
    color: '#888888',
    ...overrides,
  };
}

function mockMember(): NonNullable<ProjectData['members']>[number] {
  return {
    id: 'member-id',
    projectId: 'project-id',
    userId: 'user-id',
    role: 'developer',
    addedAt: new Date('2024-01-01'),
    user: {
      id: 'user-id',
      email: 'dev@test.com',
      name: 'Developer',
      avatarUrl: null,
      role: 'developer',
      settings: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };
}

function mockProject(overrides: Partial<ProjectData> = {}): ProjectData {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Test Project',
    code: 'PRJ-001',
    description: 'A test project',
    status: 'active',
    stageId: 'stage-id',
    managerId: 'manager-id',
    contactId: 'contact-id',
    dealId: 'deal-id',
    budgetAmount: 100000,
    budgetCurrency: 'RUB',
    startDate: new Date('2024-01-01'),
    deadline: new Date('2024-12-31'),
    actualEndDate: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    stage: mockStage(),
    members: [],
    manager: null,
    contact: null,
    deal: null,
    tags: [],
    attributes: null,
    ...overrides,
  };
}

/**
 * Create a mock fetch function that returns a controlled Response.
 */
function createMockFetch(responseData: unknown, status = 200, ok = true) {
  return async () => {
    return {
      ok,
      status,
      json: async () => responseData,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
    } as Response;
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('ProjectApiClient', () => {
  let client: ProjectApiClient;

  beforeEach(() => {
    client = new ProjectApiClient();
  });

  // ── getProjects ────────────────────────────────────────────────────

  describe('getProjects', () => {
    it('should return projects list with count', async () => {
      const project = mockProject();
      const mockData = { data: [project], count: 1 };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getProjects();

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].id, project.id);
      assert.strictEqual(result.data[0].title, project.title);
      assert.strictEqual(result.count, 1);
    });

    it('should apply status filter', async () => {
      const mockData = { data: [mockProject()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({ status: 'active' });

      assert.ok(capturedUrl.includes('status=active'));
    });

    it('should apply managerId filter', async () => {
      const mockData = { data: [mockProject()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({ managerId: 'user-789' });

      assert.ok(capturedUrl.includes('managerId=user-789'));
    });

    it('should apply contactId filter', async () => {
      const mockData = { data: [mockProject()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({ contactId: 'contact-001' });

      assert.ok(capturedUrl.includes('contactId=contact-001'));
    });

    it('should apply dealId filter', async () => {
      const mockData = { data: [mockProject()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({ dealId: 'deal-123' });

      assert.ok(capturedUrl.includes('dealId=deal-123'));
    });

    it('should apply skip and take pagination', async () => {
      const mockData = { data: [mockProject()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({ skip: 10, take: 20 });

      assert.ok(capturedUrl.includes('skip=10'));
      assert.ok(capturedUrl.includes('take=20'));
    });

    it('should skip undefined filter params', async () => {
      const mockData = { data: [mockProject()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({ status: 'active', managerId: undefined });

      assert.ok(capturedUrl.includes('status=active'));
      assert.ok(!capturedUrl.includes('managerId'));
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch projects',
        message: 'Database connection error',
      };

      client.fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getProjects(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch projects');
          return true;
        }
      );
    });

    it('should handle empty response', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getProjects();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  // ── getProject ─────────────────────────────────────────────────────

  describe('getProject', () => {
    it('should return single project by ID', async () => {
      const project = mockProject();
      const mockData = { data: project };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getProject(project.id);

      assert.strictEqual(result.data.id, project.id);
      assert.strictEqual(result.data.title, project.title);
      assert.strictEqual(result.data.code, project.code);
    });

    it('should return project with nested relations', async () => {
      const project = mockProject({
        members: [mockMember()],
        stage: mockStage({ code: 'in_progress', name: 'In Progress' }),
      });
      client.fetchFn = createMockFetch({ data: project });

      const result = await client.getProject(project.id);

      assert.ok(result.data.stage, 'Stage should be included');
      assert.strictEqual(result.data.stage.id, 'stage-id');
      assert.ok(Array.isArray(result.data.members), 'Members should be an array');
      assert.strictEqual(result.data.members!.length, 1);
      assert.strictEqual(result.data.members![0].role, 'developer');
    });

    it('should throw ApiClientError when ID is empty', async () => {
      await assert.rejects(
        async () => client.getProject(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 400);
          assert.strictEqual(apiError.error, 'Validation failed');
          assert.strictEqual(apiError.message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 response', async () => {
      const mockError = {
        error: 'Not found',
        message: 'Project with id non-existent not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getProject('non-existent'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for project ID', async () => {
      const project = mockProject();
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: project }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProject('test-project-id');

      assert.ok(capturedUrl.includes('/projects/test-project-id'));
    });
  });

  // ── createProject ──────────────────────────────────────────────────

  describe('createProject', () => {
    it('should create new project and return it', async () => {
      const createData: ProjectCreateInput = {
        title: 'New Project',
        code: 'PRJ-002',
        status: 'active',
        stageId: 'stage-id',
        managerId: 'manager-id',
      };

      const project = mockProject({ title: 'New Project', code: 'PRJ-002' });
      const mockResponse = { data: project };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createProject(createData);

      assert.strictEqual(result.data.title, createData.title);
      assert.strictEqual(result.data.code, createData.code);
      assert.strictEqual(result.data.status, createData.status);
    });

    it('should send POST request with JSON body', async () => {
      const createData: ProjectCreateInput = {
        title: 'POST Test',
        code: 'PRJ-003',
        stageId: 'stage-id',
      };

      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true, status: 201,
          json: async () => ({ data: mockProject({ title: 'POST Test' }) }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createProject(createData);

      assert.strictEqual(capturedOptions?.method, 'POST');
      const body = JSON.parse(capturedOptions?.body as string);
      assert.strictEqual(body.title, 'POST Test');
    });

    it('should create project with optional fields', async () => {
      const createData: ProjectCreateInput = {
        title: 'Full Project',
        code: 'PRJ-004',
        description: 'A full project creation',
        status: 'active',
        stageId: 'stage-id',
        managerId: 'user-id',
        contactId: 'contact-id',
        dealId: 'deal-id',
        budgetAmount: 200000,
        budgetCurrency: 'EUR',
        startDate: '2024-01-15',
        deadline: '2024-12-31',
      };

      let capturedBody: string | undefined;

      client.fetchFn = async (_url, options) => {
        capturedBody = options?.body as string;
        return {
          ok: true, status: 201,
          json: async () => ({ data: mockProject({ ...createData }) }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createProject(createData);

      const body = JSON.parse(capturedBody!);
      assert.strictEqual(body.contactId, 'contact-id');
      assert.strictEqual(body.budgetAmount, 200000);
      assert.strictEqual(body.budgetCurrency, 'EUR');
      assert.strictEqual(body.description, 'A full project creation');
    });

    it('should handle validation error (400, missing title)', async () => {
      const invalidData: ProjectCreateInput = {
        title: '',
        code: 'PRJ-005',
        stageId: 'stage-id',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'title is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createProject(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 400);
          assert.strictEqual(apiError.error, 'Validation failed');
          assert.strictEqual(apiError.message, 'title is required');
          return true;
        }
      );
    });

    it('should handle validation error (missing stageId)', async () => {
      const invalidData: ProjectCreateInput = {
        title: 'No Stage',
        code: 'PRJ-006',
        stageId: '',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'stageId is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createProject(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'stageId is required');
          return true;
        }
      );
    });
  });

  // ── updateProject ──────────────────────────────────────────────────

  describe('updateProject', () => {
    it('should update project and return updated data', async () => {
      const updateData: ProjectUpdateInput = {
        title: 'Updated Title',
        status: 'completed',
        description: 'Updated description',
      };

      const updated = mockProject({ ...updateData });
      client.fetchFn = createMockFetch({ data: updated });

      const result = await client.updateProject(updated.id, updateData);

      assert.strictEqual(result.data.title, 'Updated Title');
      assert.strictEqual(result.data.status, 'completed');
      assert.strictEqual(result.data.description, 'Updated description');
    });

    it('should send PATCH request with JSON body', async () => {
      const updateData: ProjectUpdateInput = { title: 'Patched' };
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockProject({ title: 'Patched' }) }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateProject('project-1', updateData);

      assert.strictEqual(capturedOptions?.method, 'PATCH');
      const body = JSON.parse(capturedOptions?.body as string);
      assert.strictEqual(body.title, 'Patched');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateProject('', { title: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.error, 'Validation failed');
          assert.strictEqual(apiError.message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when project not found', async () => {
      const mockError = {
        error: 'Not found',
        message: 'Project with id missing not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateProject('missing', { title: 'Nope' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should update with budget fields', async () => {
      const updateData: ProjectUpdateInput = {
        budgetAmount: 150000,
        budgetCurrency: 'USD',
      };

      let capturedBody: string | undefined;

      client.fetchFn = async (_url, options) => {
        capturedBody = options?.body as string;
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockProject() }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateProject('project-1', updateData);

      const body = JSON.parse(capturedBody!);
      assert.strictEqual(body.budgetAmount, 150000);
      assert.strictEqual(body.budgetCurrency, 'USD');
    });

    it('should update with date fields', async () => {
      const updateData: ProjectUpdateInput = {
        deadline: '2025-06-30',
        actualEndDate: '2025-06-15',
      };

      let capturedBody: string | undefined;

      client.fetchFn = async (_url, options) => {
        capturedBody = options?.body as string;
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockProject() }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateProject('project-1', updateData);

      const body = JSON.parse(capturedBody!);
      assert.strictEqual(body.deadline, '2025-06-30');
      assert.strictEqual(body.actualEndDate, '2025-06-15');
    });
  });

  // ── deleteProject ──────────────────────────────────────────────────

  describe('deleteProject', () => {
    it('should soft-delete project and return project data', async () => {
      const project = mockProject();
      const mockResponse = { data: project, message: 'Project soft-deleted successfully' };
      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteProject(project.id);

      assert.strictEqual(result.data.id, project.id);
      assert.strictEqual(result.data.title, project.title);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteProject(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when project not found', async () => {
      const mockError = {
        error: 'Not found',
        message: 'Project with id missing not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteProject('missing'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send DELETE request', async () => {
      const project = mockProject();
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true, status: 200,
          json: async () => ({ data: project, message: 'Deleted' }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.deleteProject(project.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });

    it('should return success message on delete', async () => {
      const project = mockProject();
      const mockResponse = { data: project, message: 'Project soft-deleted successfully' };
      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteProject(project.id);

      assert.strictEqual(result.data.id, project.id);
    });
  });

  // ── Network errors ──────────────────────────────────────────────

  describe('network errors', () => {
    it('should propagate fetch rejection', async () => {
      const networkError = new Error('Connection refused');
      client.fetchFn = async () => { throw networkError; };

      await assert.rejects(
        async () => client.getProjects(),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.strictEqual((err as Error).message, 'Connection refused');
          return true;
        }
      );
    });

    it('should handle non-JSON error response body', async () => {
      client.fetchFn = async () => {
        return {
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          json: async () => { throw new SyntaxError('Unexpected token <'); },
          headers: {
            get: (name: string) => (name === 'content-type' ? 'text/html' : null),
          },
        } as unknown as Response;
      };

      await assert.rejects(
        async () => client.getProjects(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 502);
          assert.strictEqual(apiError.error, 'Unknown error');
          assert.strictEqual(apiError.message, 'Bad Gateway');
          return true;
        }
      );
    });

    it('should handle non-JSON with empty statusText', async () => {
      client.fetchFn = async () => {
        return {
          ok: false,
          status: 500,
          statusText: '',
          json: async () => { throw new Error('not json'); },
          headers: {
            get: () => null,
          },
        } as unknown as Response;
      };

      await assert.rejects(
        async () => client.getProject('some-id'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 500);
          return true;
        }
      );
    });
  });

  // ── ApiClientError class ────────────────────────────────────────

  describe('ApiClientError', () => {
    it('should have correct error properties', () => {
      const error = new ApiClientError(404, 'Not found', 'Project not found');

      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.error, 'Not found');
      assert.strictEqual(error.message, 'Project not found');
      assert.strictEqual(error.name, 'ApiClientError');
    });

    it('should be instance of Error', () => {
      const error = new ApiClientError(500, 'Server error', 'Oops');
      assert.ok(error instanceof Error);
    });
  });

  // ── Singleton instance ──────────────────────────────────────────

  describe('singleton instance', () => {
    it('should export default singleton', () => {
      assert.ok(projectsApi instanceof ProjectApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof projectsApi.getProjects, 'function');
      assert.strictEqual(typeof projectsApi.getProject, 'function');
      assert.strictEqual(typeof projectsApi.createProject, 'function');
      assert.strictEqual(typeof projectsApi.updateProject, 'function');
      assert.strictEqual(typeof projectsApi.deleteProject, 'function');
    });
  });

  // ── URL construction ───────────────────────────────────────────

  describe('URL construction', () => {
    it('should use custom baseUrl from config', async () => {
      const customClient = new ProjectApiClient({ baseUrl: 'https://api.example.com/v2' });
      let capturedUrl = '';

      customClient.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockProject()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await customClient.getProjects();

      assert.ok(capturedUrl.startsWith('https://api.example.com/v2/projects'));
    });

    it('should combine multiple filter params in URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockProject()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({
        status: 'active',
        managerId: 'user-1',
        contactId: 'contact-1',
      });

      assert.ok(capturedUrl.includes('status=active'));
      assert.ok(capturedUrl.includes('managerId=user-1'));
      assert.ok(capturedUrl.includes('contactId=contact-1'));
    });

    it('should combine filters with pagination', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockProject()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects({
        status: 'active',
        skip: 5,
        take: 10,
      });

      assert.ok(capturedUrl.includes('status=active'));
      assert.ok(capturedUrl.includes('skip=5'));
      assert.ok(capturedUrl.includes('take=10'));
    });
  });

  // ── URL path tests ─────────────────────────────────────────────

  describe('URL paths', () => {
    it('should build correct collection URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockProject()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProjects();

      assert.ok(capturedUrl.endsWith('/projects'));
    });

    it('should build correct single resource URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockProject() }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getProject('abc-123');

      assert.ok(capturedUrl.endsWith('/projects/abc-123'));
    });

    it('should build correct update URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockProject() }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateProject('xyz-789', { title: 'Updated' });

      assert.ok(capturedUrl.endsWith('/projects/xyz-789'));
    });

    it('should build correct delete URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockProject() }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.deleteProject('del-456');

      assert.ok(capturedUrl.endsWith('/projects/del-456'));
    });
  });
});
