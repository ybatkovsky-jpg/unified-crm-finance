/**
 * Pipeline API Client Tests
 *
 * Tests for PipelineApiClient with mocked fetch.
 * Run with: npx tsx --test src/lib/api/pipelines.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PipelineApiClient, ApiClientError, pipelinesApi } from './pipelines';
import type { PipelineData, DealStageData } from './types';
import type { PipelineWithStages } from './pipelines';

// ── Mock factories ──────────────────────────────────────────────────

function mockStage(overrides: Partial<DealStageData> = {}): DealStageData {
  return {
    id: 'stage-new-id',
    code: 'new',
    name: 'New',
    order: 1,
    probability: 10,
    isWonStage: false,
    isLostStage: false,
    color: '#888888',
    ...overrides,
  };
}

function mockPipeline(overrides: Partial<PipelineData> = {}): PipelineData {
  return {
    id: 'pipe-default-id',
    code: 'default',
    name: 'Default Pipeline',
    description: 'Standard sales pipeline',
    isActive: true,
    ...overrides,
  };
}

function mockPipelineWithStages(
  overrides: Partial<PipelineWithStages> = {}
): PipelineWithStages {
  return {
    ...mockPipeline(),
    DealStage: [
      mockStage({ id: 'stage-new-id', code: 'new', name: 'New', order: 1 }),
      mockStage({ id: 'stage-qual-id', code: 'qualified', name: 'Qualified', order: 2 }),
      mockStage({ id: 'stage-won-id', code: 'won', name: 'Won', order: 7, isWonStage: true }),
      mockStage({ id: 'stage-lost-id', code: 'lost', name: 'Lost', order: 8, isLostStage: true }),
    ],
    ...overrides,
  };
}

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

describe('PipelineApiClient', () => {
  let client: PipelineApiClient;

  beforeEach(() => {
    client = new PipelineApiClient();
  });

  // ── getPipelines ────────────────────────────────────────────────

  describe('getPipelines', () => {
    it('should return pipelines list with count', async () => {
      const pipe1 = mockPipeline();
      const pipe2 = mockPipeline({ id: 'pipe-2', code: 'secondary', name: 'Secondary' });
      const mockData = { data: [pipe1, pipe2], count: 2 };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getPipelines();

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.data[0].id, pipe1.id);
      assert.strictEqual(result.data[0].code, pipe1.code);
      assert.strictEqual(result.data[1].id, 'pipe-2');
      assert.strictEqual(result.count, 2);
    });

    it('should return empty list when no pipelines exist', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getPipelines();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch pipelines',
        message: 'Database connection error',
      };

      client.fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getPipelines(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch pipelines');
          return true;
        }
      );
    });

    it('should call correct URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockPipeline()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getPipelines();

      assert.ok(capturedUrl.includes('/api/pipelines'));
    });
  });

  // ── getPipeline ─────────────────────────────────────────────────

  describe('getPipeline', () => {
    it('should return pipeline with stages sorted by order', async () => {
      const pipeWithStages = mockPipelineWithStages();
      const mockData = { data: pipeWithStages };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getPipeline('pipe-default-id');

      assert.strictEqual(result.data.id, 'pipe-default-id');
      assert.strictEqual(result.data.code, 'default');
      assert.ok(Array.isArray(result.data.DealStage), 'DealStage should be an array');
      assert.strictEqual(result.data.DealStage.length, 4);
      // Verify stages are in order
      assert.strictEqual(result.data.DealStage[0].order, 1);
      assert.strictEqual(result.data.DealStage[0].code, 'new');
      assert.strictEqual(result.data.DealStage[1].order, 2);
      assert.strictEqual(result.data.DealStage[1].code, 'qualified');
      assert.strictEqual(result.data.DealStage[2].order, 7);
      assert.strictEqual(result.data.DealStage[3].order, 8);
    });

    it('should return pipeline with isWonStage and isLostStage flags', async () => {
      const pipeWithStages = mockPipelineWithStages();
      const mockData = { data: pipeWithStages };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getPipeline('pipe-default-id');

      const wonStage = result.data.DealStage.find(s => s.code === 'won');
      const lostStage = result.data.DealStage.find(s => s.code === 'lost');

      assert.ok(wonStage, 'Won stage should exist');
      assert.strictEqual(wonStage!.isWonStage, true);
      assert.ok(lostStage, 'Lost stage should exist');
      assert.strictEqual(lostStage!.isLostStage, true);
    });

    it('should return pipeline with isActive field', async () => {
      const pipeWithStages = mockPipelineWithStages({ isActive: true });
      const mockData = { data: pipeWithStages };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getPipeline('pipe-default-id');

      assert.strictEqual(result.data.isActive, true);
    });

    it('should throw ApiClientError when ID is empty', async () => {
      await assert.rejects(
        async () => client.getPipeline(''),
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
        message: 'Pipeline with id non-existent not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getPipeline('non-existent'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for pipeline ID', async () => {
      const pipeWithStages = mockPipelineWithStages();
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: pipeWithStages }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getPipeline('test-pipe-id');

      assert.ok(capturedUrl.includes('/pipelines/test-pipe-id'));
    });
  });

  // ── Network errors ──────────────────────────────────────────────

  describe('network errors', () => {
    it('should propagate fetch rejection for getPipelines', async () => {
      const networkError = new Error('Connection refused');
      client.fetchFn = async () => { throw networkError; };

      await assert.rejects(
        async () => client.getPipelines(),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.strictEqual((err as Error).message, 'Connection refused');
          return true;
        }
      );
    });

    it('should propagate fetch rejection for getPipeline', async () => {
      const networkError = new Error('Network error');
      client.fetchFn = async () => { throw networkError; };

      await assert.rejects(
        async () => client.getPipeline('some-id'),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.strictEqual((err as Error).message, 'Network error');
          return true;
        }
      );
    });
  });

  // ── ApiClientError class ────────────────────────────────────────

  describe('ApiClientError', () => {
    it('should have correct error properties', () => {
      const error = new ApiClientError(404, 'Not found', 'Pipeline not found');

      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.error, 'Not found');
      assert.strictEqual(error.message, 'Pipeline not found');
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
      assert.ok(pipelinesApi instanceof PipelineApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof pipelinesApi.getPipelines, 'function');
      assert.strictEqual(typeof pipelinesApi.getPipeline, 'function');
    });
  });

  // ── URL construction ────────────────────────────────────────────

  describe('URL construction', () => {
    it('should use custom baseUrl from config', async () => {
      const customClient = new PipelineApiClient({ baseUrl: 'https://api.example.com/v2' });
      let capturedUrl = '';

      customClient.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockPipeline()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await customClient.getPipelines();

      assert.ok(capturedUrl.startsWith('https://api.example.com/v2/pipelines'));
    });

    it('should use default /api base URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockPipeline()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getPipelines();

      assert.ok(capturedUrl.startsWith('/api/pipelines'));
    });
  });
});
