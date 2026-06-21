/**
 * Interaction API Client Tests
 *
 * Tests for InteractionApiClient with mocked fetch.
 * Run with: tsx --test src/lib/api/interactions.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { InteractionApiClient, ApiClientError, interactionsApi } from './interactions';
import type { InteractionData, InteractionCreateInput, InteractionUpdateInput } from './types';

/**
 * Mock interaction data
 */
const mockInteraction: InteractionData = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  contactId: '550e8400-e29b-41d4-a716-446655440000',
  type: 'call',
  direction: 'outbound',
  subject: 'Follow-up call',
  content: 'Discussed project timeline',
  scheduledAt: new Date('2024-02-01T10:00:00.000Z'),
  completedAt: new Date('2024-02-01T10:30:00.000Z'),
  authorId: 'user-001',
  eventId: null,
  createdAt: new Date('2024-02-01T10:30:00.000Z'),
  updatedAt: new Date('2024-02-01T10:30:00.000Z'),
};

const mockInteraction2: InteractionData = {
  ...mockInteraction,
  id: '550e8400-e29b-41d4-a716-446655440002',
  type: 'email',
  subject: 'Proposal sent',
  content: 'Sent project proposal to client',
  direction: 'outbound',
  scheduledAt: null,
  completedAt: new Date('2024-02-02T14:00:00.000Z'),
};

/**
 * Mock fetch implementation
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

describe('InteractionApiClient', () => {
  let client: InteractionApiClient;

  beforeEach(() => {
    client = new InteractionApiClient();
  });

  describe('getInteractions', () => {
    it('should return interactions list', async () => {
      const mockData = {
        data: [mockInteraction, mockInteraction2],
        count: 2,
      };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getInteractions();

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.data[0].id, mockInteraction.id);
      assert.strictEqual(result.data[1].type, 'email');
      assert.strictEqual(result.count, 2);
    });

    it('should pass contactId filter in query params', async () => {
      const mockData = { data: [mockInteraction], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getInteractions({ contactId: mockInteraction.contactId });

      assert.ok(capturedUrl.includes('contactId=' + mockInteraction.contactId));
    });

    it('should pass type filter in query params', async () => {
      const mockData = { data: [mockInteraction], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getInteractions({ type: 'call' });

      assert.ok(capturedUrl.includes('type=call'));
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch interactions',
        message: 'Database connection error',
      };

      client.fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getInteractions(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch interactions');
          return true;
        }
      );
    });

    it('should return empty list', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getInteractions();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('getInteraction', () => {
    it('should return single interaction by ID', async () => {
      const mockData = { data: mockInteraction };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getInteraction(mockInteraction.id);

      assert.strictEqual(result.data.id, mockInteraction.id);
      assert.strictEqual(result.data.type, mockInteraction.type);
      assert.strictEqual(result.data.subject, mockInteraction.subject);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.getInteraction(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          return true;
        }
      );
    });

    it('should handle 404 response', async () => {
      const mockError = {
        error: 'Not found',
        message: `Interaction with id ${mockInteraction.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getInteraction(mockInteraction.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for interaction ID', async () => {
      const mockData = { data: mockInteraction };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getInteraction('test-id-456');

      assert.ok(capturedUrl.includes('/interactions/test-id-456'));
    });
  });

  describe('createInteraction', () => {
    it('should create new interaction and return it (201)', async () => {
      const createData: InteractionCreateInput = {
        contactId: mockInteraction.contactId,
        type: 'meeting',
        authorId: 'user-001',
        subject: 'Kickoff meeting',
        content: 'Project kickoff discussion',
        direction: 'inbound',
      };

      const mockResponse = { data: { ...mockInteraction, ...createData } };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createInteraction(createData);

      assert.strictEqual(result.data.subject, createData.subject);
      assert.strictEqual(result.data.type, 'meeting');
    });

    it('should handle validation error (missing contactId)', async () => {
      const invalidData: InteractionCreateInput = {
        contactId: '',
        type: 'call',
        authorId: 'user-001',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'contactId is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createInteraction(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          return true;
        }
      );
    });

    it('should handle validation error (invalid type)', async () => {
      const invalidData: InteractionCreateInput = {
        contactId: mockInteraction.contactId,
        type: 'invalid_type',
        authorId: 'user-001',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'type must be one of: call|meeting|email|note|task',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createInteraction(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 400);
          return true;
        }
      );
    });

    it('should handle missing content for non-note type', async () => {
      const invalidData: InteractionCreateInput = {
        contactId: mockInteraction.contactId,
        type: 'call',
        authorId: 'user-001',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'content is required for non-note interaction types',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createInteraction(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.message, 'content is required for non-note interaction types');
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      const createData: InteractionCreateInput = {
        contactId: mockInteraction.contactId,
        type: 'note',
        content: 'A quick note',
        authorId: 'user-001',
      };

      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: mockInteraction }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createInteraction(createData);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('updateInteraction', () => {
    it('should update interaction and return updated data', async () => {
      const updateData: InteractionUpdateInput = {
        subject: 'Updated subject',
        content: 'Updated content',
      };

      const mockResponse = {
        data: { ...mockInteraction, ...updateData },
      };

      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.updateInteraction(mockInteraction.id, updateData);

      assert.strictEqual(result.data.subject, 'Updated subject');
      assert.strictEqual(result.data.content, 'Updated content');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateInteraction('', { subject: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when interaction not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Interaction with id ${mockInteraction.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateInteraction(mockInteraction.id, { subject: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send PUT request', async () => {
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockInteraction }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateInteraction(mockInteraction.id, { subject: 'Test' });

      assert.strictEqual(capturedOptions?.method, 'PUT');
    });
  });

  describe('deleteInteraction', () => {
    it('should delete interaction and return message', async () => {
      const mockResponse = {
        data: mockInteraction,
        message: 'Interaction deleted successfully',
      };

      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteInteraction(mockInteraction.id);

      assert.strictEqual(result.data.id, mockInteraction.id);
      assert.strictEqual(result.message, 'Interaction deleted successfully');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteInteraction(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when interaction not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Interaction with id ${mockInteraction.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteInteraction(mockInteraction.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send DELETE request', async () => {
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: mockInteraction,
            message: 'Interaction deleted successfully',
          }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.deleteInteraction(mockInteraction.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });
  });

  describe('getContactInteractions', () => {
    it('should return timeline for a contact', async () => {
      const mockData = {
        data: [mockInteraction, mockInteraction2],
        count: 2,
      };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContactInteractions(mockInteraction.contactId);

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.data[0].contactId, mockInteraction.contactId);
      assert.strictEqual(result.count, 2);
    });

    it('should throw error when contactId is empty', async () => {
      await assert.rejects(
        async () => client.getContactInteractions(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'contactId is required');
          return true;
        }
      );
    });

    it('should handle 404 when contact not found', async () => {
      const mockError = {
        error: 'Not found',
        message: 'Contact with id unknown not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getContactInteractions('unknown-contact'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 404);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should return empty timeline for contact with no interactions', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContactInteractions(mockInteraction.contactId);

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });

    it('should build correct URL for nested route', async () => {
      const mockData = { data: [mockInteraction], count: 1 };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 200,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.getContactInteractions(mockInteraction.contactId);

      assert.ok(capturedUrl.includes(`/contacts/${mockInteraction.contactId}/interactions`));
    });
  });

  describe('ApiClientError', () => {
    it('should have correct error properties', () => {
      const error = new ApiClientError(400, 'Bad Request', 'Invalid input');

      assert.strictEqual(error.statusCode, 400);
      assert.strictEqual(error.error, 'Bad Request');
      assert.strictEqual(error.message, 'Invalid input');
      assert.strictEqual(error.name, 'ApiClientError');
    });
  });

  describe('singleton instance', () => {
    it('should export default singleton', () => {
      assert.ok(interactionsApi instanceof InteractionApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof interactionsApi.getInteractions, 'function');
      assert.strictEqual(typeof interactionsApi.getInteraction, 'function');
      assert.strictEqual(typeof interactionsApi.createInteraction, 'function');
      assert.strictEqual(typeof interactionsApi.updateInteraction, 'function');
      assert.strictEqual(typeof interactionsApi.deleteInteraction, 'function');
      assert.strictEqual(typeof interactionsApi.getContactInteractions, 'function');
    });
  });
});
