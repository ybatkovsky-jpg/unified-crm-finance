/**
 * Deal API Client Tests
 *
 * Tests for DealApiClient with mocked fetch.
 * Run with: npx tsx --test src/lib/api/deals.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { DealApiClient, ApiClientError, dealsApi } from './deals';
import type { DealData, DealCreateInput, DealUpdateInput, DealMoveInput } from './types';

// ── Mock factories ──────────────────────────────────────────────────

function mockStage(overrides: Partial<DealData['stage']> = {}): DealData['stage'] {
  return {
    id: 'stage-id',
    code: 'new',
    name: 'New',
    order: 1,
    probability: 10,
    color: '#888888',
    isWonStage: false,
    isLostStage: false,
    ...overrides,
  };
}

function mockPipeline(): DealData['pipeline'] {
  return {
    id: 'pipe-id',
    code: 'default',
    name: 'Default Pipeline',
  };
}

function mockContact(): NonNullable<DealData['contact']> {
  return {
    id: 'contact-id',
    type: 'company',
    firstName: null,
    lastName: null,
    middleName: null,
    companyName: 'Test Corp',
    inn: null,
    kpp: null,
    ogrn: null,
    email: null,
    phone: null,
    address: null,
    physicalAddress: null,
    position: null,
    notes: null,
    sourceId: null,
    ownerId: null,
    status: 'active',
    tags: [],
    attributes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function mockManager(): NonNullable<DealData['manager']> {
  return {
    id: 'user-id',
    email: 'manager@test.com',
    name: 'Test Manager',
    avatarUrl: null,
    role: 'manager',
    settings: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function mockHistoryEntry(): NonNullable<DealData['history']>[number] {
  return {
    id: 'hist-id',
    dealId: 'deal-id',
    fromStageId: null,
    toStageId: 'stage-id',
    comment: 'Initial creation',
    changedBy: 'user-id',
    changedAt: new Date('2024-01-01'),
    fromStage: null,
    toStage: mockStage(),
    changedByUser: mockManager(),
  };
}

function mockDeal(overrides: Partial<DealData> = {}): DealData {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    number: 'С-2024-00001',
    title: 'Test Deal',
    pipelineId: 'pipe-id',
    stageId: 'stage-id',
    contactId: null,
    amount: 100000,
    currency: 'RUB',
    expectedCloseDate: new Date('2024-12-31'),
    actualCloseDate: null,
    closedAt: null,
    managerId: null,
    description: null,
    lossReason: null,
    sourceId: null,
    status: 'active',
    attributes: null,
    tags: [],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    stage: mockStage(),
    pipeline: mockPipeline(),
    contact: null,
    manager: null,
    history: [],
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

describe('DealApiClient', () => {
  let client: DealApiClient;

  beforeEach(() => {
    client = new DealApiClient();
  });

  // ── getDeals ────────────────────────────────────────────────────

  describe('getDeals', () => {
    it('should return deals list with count', async () => {
      const deal = mockDeal();
      const mockData = { data: [deal], count: 1 };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getDeals();

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].id, deal.id);
      assert.strictEqual(result.data[0].number, deal.number);
      assert.strictEqual(result.count, 1);
    });

    it('should apply pipelineId filter', async () => {
      const mockData = { data: [mockDeal()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({ pipelineId: 'pipe-123' });

      assert.ok(capturedUrl.includes('pipelineId=pipe-123'));
    });

    it('should apply stageId filter', async () => {
      const mockData = { data: [mockDeal()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({ stageId: 'stage-456' });

      assert.ok(capturedUrl.includes('stageId=stage-456'));
    });

    it('should apply status filter', async () => {
      const mockData = { data: [mockDeal()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({ status: 'open' });

      assert.ok(capturedUrl.includes('status=open'));
    });

    it('should apply managerId filter', async () => {
      const mockData = { data: [mockDeal()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({ managerId: 'user-789' });

      assert.ok(capturedUrl.includes('managerId=user-789'));
    });

    it('should apply contactId filter', async () => {
      const mockData = { data: [mockDeal()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({ contactId: 'contact-001' });

      assert.ok(capturedUrl.includes('contactId=contact-001'));
    });

    it('should skip undefined filter params', async () => {
      const mockData = { data: [mockDeal()], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({ pipelineId: 'p1', stageId: undefined });

      assert.ok(capturedUrl.includes('pipelineId=p1'));
      assert.ok(!capturedUrl.includes('stageId'));
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch deals',
        message: 'Database connection error',
      };

      client.fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getDeals(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch deals');
          return true;
        }
      );
    });

    it('should handle empty response', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getDeals();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  // ── getDeal ─────────────────────────────────────────────────────

  describe('getDeal', () => {
    it('should return single deal by ID', async () => {
      const deal = mockDeal();
      const mockData = { data: deal };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getDeal(deal.id);

      assert.strictEqual(result.data.id, deal.id);
      assert.strictEqual(result.data.title, deal.title);
      assert.strictEqual(result.data.number, deal.number);
    });

    it('should return deal with nested relations', async () => {
      const deal = mockDeal({
        contact: mockContact(),
        manager: mockManager(),
        history: [mockHistoryEntry()],
      });
      client.fetchFn = createMockFetch({ data: deal });

      const result = await client.getDeal(deal.id);

      assert.ok(result.data.stage, 'Stage should be included');
      assert.strictEqual(result.data.stage.id, 'stage-id');
      assert.ok(result.data.pipeline, 'Pipeline should be included');
      assert.ok(result.data.contact, 'Contact should be included');
      assert.strictEqual(result.data.contact!.companyName, 'Test Corp');
      assert.ok(result.data.manager, 'Manager should be included');
      assert.ok(Array.isArray(result.data.history), 'History should be an array');
      assert.strictEqual(result.data.history!.length, 1);
    });

    it('should throw ApiClientError when ID is empty', async () => {
      await assert.rejects(
        async () => client.getDeal(''),
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
        message: 'Deal with id non-existent not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getDeal('non-existent'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for deal ID', async () => {
      const deal = mockDeal();
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: deal }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeal('test-deal-id');

      assert.ok(capturedUrl.includes('/deals/test-deal-id'));
    });
  });

  // ── createDeal ──────────────────────────────────────────────────

  describe('createDeal', () => {
    it('should create new deal and return it with 201', async () => {
      const createData: DealCreateInput = {
        title: 'New Deal',
        pipelineId: 'pipe-id',
        stageId: 'stage-id',
        amount: 50000,
        currency: 'USD',
      };

      const deal = mockDeal({ title: 'New Deal', amount: 50000, currency: 'USD' });
      const mockResponse = { data: deal };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createDeal(createData);

      assert.strictEqual(result.data.title, createData.title);
      assert.strictEqual(result.data.amount, createData.amount);
      assert.strictEqual(result.data.currency, createData.currency);
    });

    it('should send POST request with JSON body', async () => {
      const createData: DealCreateInput = {
        title: 'POST Test',
        pipelineId: 'pipe-id',
        stageId: 'stage-id',
      };

      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true, status: 201,
          json: async () => ({ data: mockDeal({ title: 'POST Test' }) }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createDeal(createData);

      assert.strictEqual(capturedOptions?.method, 'POST');
      const body = JSON.parse(capturedOptions?.body as string);
      assert.strictEqual(body.title, 'POST Test');
    });

    it('should create deal with optional fields', async () => {
      const createData: DealCreateInput = {
        title: 'Full Deal',
        pipelineId: 'pipe-id',
        stageId: 'stage-id',
        contactId: 'contact-id',
        amount: 200000,
        currency: 'EUR',
        expectedCloseDate: '2024-12-31',
        managerId: 'user-id',
        description: 'A full deal creation',
        attributes: { source: 'web' },
      };

      let capturedBody: string | undefined;

      client.fetchFn = async (_url, options) => {
        capturedBody = options?.body as string;
        return {
          ok: true, status: 201,
          json: async () => ({ data: mockDeal({ ...createData }) }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createDeal(createData);

      const body = JSON.parse(capturedBody!);
      assert.strictEqual(body.contactId, 'contact-id');
      assert.strictEqual(body.amount, 200000);
      assert.strictEqual(body.currency, 'EUR');
      assert.strictEqual(body.description, 'A full deal creation');
      assert.deepStrictEqual(body.attributes, { source: 'web' });
    });

    it('should handle validation error (400, missing title)', async () => {
      const invalidData: DealCreateInput = {
        title: '',
        pipelineId: 'pipe-id',
        stageId: 'stage-id',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'title is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createDeal(invalidData),
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

    it('should handle validation error (missing pipelineId)', async () => {
      const invalidData: DealCreateInput = {
        title: 'No Pipeline',
        pipelineId: '',
        stageId: 'stage-id',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'pipelineId is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createDeal(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'pipelineId is required');
          return true;
        }
      );
    });
  });

  // ── updateDeal ──────────────────────────────────────────────────

  describe('updateDeal', () => {
    it('should update deal and return updated data', async () => {
      const updateData: DealUpdateInput = {
        title: 'Updated Title',
        amount: 150000,
        description: 'Updated description',
      };

      const updated = mockDeal({ ...updateData });
      client.fetchFn = createMockFetch({ data: updated });

      const result = await client.updateDeal(updated.id, updateData);

      assert.strictEqual(result.data.title, 'Updated Title');
      assert.strictEqual(result.data.amount, 150000);
      assert.strictEqual(result.data.description, 'Updated description');
    });

    it('should send PATCH request with JSON body', async () => {
      const updateData: DealUpdateInput = { title: 'Patched' };
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockDeal({ title: 'Patched' }) }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateDeal('deal-1', updateData);

      assert.strictEqual(capturedOptions?.method, 'PATCH');
      const body = JSON.parse(capturedOptions?.body as string);
      assert.strictEqual(body.title, 'Patched');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateDeal('', { title: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.error, 'Validation failed');
          assert.strictEqual(apiError.message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when deal not found', async () => {
      const mockError = {
        error: 'Not found',
        message: 'Deal with id missing not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateDeal('missing', { title: 'Nope' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });
  });

  // ── deleteDeal ──────────────────────────────────────────────────

  describe('deleteDeal', () => {
    it('should soft-delete deal and return deal data', async () => {
      const deal = mockDeal();
      const mockResponse = { data: deal, message: 'Deal soft-deleted successfully' };
      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteDeal(deal.id);

      assert.strictEqual(result.data.id, deal.id);
      assert.strictEqual(result.data.title, deal.title);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteDeal(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when deal not found', async () => {
      const mockError = {
        error: 'Not found',
        message: 'Deal with id missing not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteDeal('missing'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send DELETE request', async () => {
      const deal = mockDeal();
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true, status: 200,
          json: async () => ({ data: deal, message: 'Deleted' }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.deleteDeal(deal.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });
  });

  // ── moveDeal ────────────────────────────────────────────────────

  describe('moveDeal', () => {
    const qualifiedStage = mockStage({ id: 'stage-qualified', code: 'qualified', name: 'Qualified' });

    it('should move deal to new stage and return updated deal', async () => {
      const moveInput: DealMoveInput = {
        stageId: 'stage-qualified',
        changedBy: 'user-id',
        comment: 'Qualified after demo',
      };

      const movedDeal = mockDeal({
        stageId: 'stage-qualified',
        stage: qualifiedStage,
      });
      client.fetchFn = createMockFetch({ data: movedDeal });

      const result = await client.moveDeal('deal-1', moveInput);

      assert.strictEqual(result.data.stageId, 'stage-qualified');
      assert.strictEqual(result.data.stage.id, 'stage-qualified');
      assert.strictEqual(result.data.stage.name, 'Qualified');
    });

    it('should send POST to /deals/[id]/move', async () => {
      const moveInput: DealMoveInput = { stageId: 'stage-q', changedBy: 'user-id' };
      let capturedUrl = '';
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (url, options) => {
        capturedUrl = url.toString();
        capturedOptions = options;
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockDeal({ stageId: 'stage-q' }) }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.moveDeal('deal-1', moveInput);

      assert.ok(capturedUrl.includes('/deals/deal-1/move'));
      assert.strictEqual(capturedOptions?.method, 'POST');
      const body = JSON.parse(capturedOptions?.body as string);
      assert.strictEqual(body.stageId, 'stage-q');
      assert.strictEqual(body.changedBy, 'user-id');
    });

    it('should throw error when ID is empty', async () => {
      const moveInput: DealMoveInput = { stageId: 'stage-1', changedBy: 'user-id' };

      await assert.rejects(
        async () => client.moveDeal('', moveInput),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle validation error (missing stageId from server)', async () => {
      const moveInput: DealMoveInput = { stageId: '', changedBy: 'user-id' };

      const mockError = {
        error: 'Validation failed',
        message: 'stageId is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.moveDeal('deal-1', moveInput),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'stageId is required');
          return true;
        }
      );
    });

    it('should handle no-change error from server', async () => {
      const moveInput: DealMoveInput = {
        stageId: 'same-stage',
        changedBy: 'user-id',
      };

      const mockError = {
        error: 'Conflict',
        message: 'Deal is already in stage same-stage',
      };

      client.fetchFn = createMockFetch(mockError, 409, false);

      await assert.rejects(
        async () => client.moveDeal('deal-1', moveInput),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 409);
          assert.strictEqual(apiError.error, 'Conflict');
          return true;
        }
      );
    });

    it('should include comment in move payload', async () => {
      const moveInput: DealMoveInput = {
        stageId: 'stage-q',
        changedBy: 'user-id',
        comment: 'Moving with comment',
      };

      let capturedBody: string | undefined;

      client.fetchFn = async (_url, options) => {
        capturedBody = options?.body as string;
        return {
          ok: true, status: 200,
          json: async () => ({ data: mockDeal() }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.moveDeal('deal-1', moveInput);

      const body = JSON.parse(capturedBody!);
      assert.strictEqual(body.comment, 'Moving with comment');
    });

    it('should handle 404 when deal not found for move', async () => {
      const moveInput: DealMoveInput = { stageId: 'stage-1', changedBy: 'user-id' };
      const mockError = { error: 'Not found', message: 'Deal not found' };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.moveDeal('missing', moveInput),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });
  });

  // ── Network errors ──────────────────────────────────────────────

  describe('network errors', () => {
    it('should propagate fetch rejection', async () => {
      const networkError = new Error('Connection refused');
      client.fetchFn = async () => { throw networkError; };

      await assert.rejects(
        async () => client.getDeals(),
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
        async () => client.getDeals(),
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
        async () => client.getDeal('some-id'),
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
      const error = new ApiClientError(404, 'Not found', 'Deal not found');

      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.error, 'Not found');
      assert.strictEqual(error.message, 'Deal not found');
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
      assert.ok(dealsApi instanceof DealApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof dealsApi.getDeals, 'function');
      assert.strictEqual(typeof dealsApi.getDeal, 'function');
      assert.strictEqual(typeof dealsApi.createDeal, 'function');
      assert.strictEqual(typeof dealsApi.updateDeal, 'function');
      assert.strictEqual(typeof dealsApi.deleteDeal, 'function');
      assert.strictEqual(typeof dealsApi.moveDeal, 'function');
    });
  });

  // ── URL construction ───────────────────────────────────────────

  describe('URL construction', () => {
    it('should use custom baseUrl from config', async () => {
      const customClient = new DealApiClient({ baseUrl: 'https://api.example.com/v2' });
      let capturedUrl = '';

      customClient.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockDeal()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await customClient.getDeals();

      assert.ok(capturedUrl.startsWith('https://api.example.com/v2/deals'));
    });

    it('should combine multiple filter params in URL', async () => {
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockDeal()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({
        pipelineId: 'p1',
        stageId: 's1',
        status: 'open',
      });

      assert.ok(capturedUrl.includes('pipelineId=p1'));
      assert.ok(capturedUrl.includes('stageId=s1'));
      assert.ok(capturedUrl.includes('status=open'));
    });

    it('should omit pagination params not in query mapping', async () => {
      // skip/take are in DealListParams type but not serialized by current client.
      // This test documents that those params are silently ignored.
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true, status: 200,
          json: async () => ({ data: [mockDeal()], count: 1 }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getDeals({ skip: 10, take: 5, pipelineId: 'p1' });

      assert.ok(capturedUrl.includes('pipelineId=p1'));
      assert.ok(!capturedUrl.includes('skip'));
      assert.ok(!capturedUrl.includes('take'));
    });
  });
});
