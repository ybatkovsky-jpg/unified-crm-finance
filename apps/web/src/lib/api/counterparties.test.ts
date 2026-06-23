/**
 * Counterparty API Client Tests
 *
 * Tests for CounterpartyApiClient with mocked fetch.
 * Run with: tsx --test src/lib/api/counterparties.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CounterpartyApiClient, ApiClientError, counterpartiesApi } from './counterparties';
import type { CounterpartyData, CounterpartyCreateInput, CounterpartyUpdateInput } from './types';

/**
 * Mock counterparty data
 */
const mockCounterparty: CounterpartyData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'ООО Пример',
  type: 'client',
  types: [],
  inn: '7701234567',
  kpp: null,
  email: 'info@example.com',
  phone: '+74951234567',
  contactPerson: null,
  address: null,
  bankName: null,
  bankAccount: null,
  korAccount: null,
  bik: null,
  notes: null,
  rating: null,
  attributes: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
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

describe('CounterpartyApiClient', () => {
  let client: CounterpartyApiClient;

  beforeEach(() => {
    client = new CounterpartyApiClient();
  });

  describe('getCounterparties', () => {
    it('should return counterparties list', async () => {
      const mockData = {
        data: [mockCounterparty],
        count: 1,
      };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getCounterparties();

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].id, mockCounterparty.id);
      assert.strictEqual(result.count, 1);
    });

    it('should pass type filter in query params', async () => {
      const mockData = { data: [mockCounterparty], count: 1 };
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

      await client.getCounterparties({ type: 'client' });

      assert.ok(capturedUrl.includes('type=client'));
    });

    it('should pass search filter in query params', async () => {
      const mockData = { data: [mockCounterparty], count: 1 };
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

      await client.getCounterparties({ search: 'пример' });

      assert.ok(capturedUrl.includes('search=%D0%BF%D1%80%D0%B8%D0%BC%D0%B5%D1%80'));
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch counterparties',
        message: 'Database connection error',
      };

      client.fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getCounterparties(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch counterparties');
          return true;
        }
      );
    });

    it('should handle empty response', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getCounterparties();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('getCounterparty', () => {
    it('should return single counterparty by ID', async () => {
      const mockData = { data: mockCounterparty };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getCounterparty(mockCounterparty.id);

      assert.strictEqual(result.data.id, mockCounterparty.id);
      assert.strictEqual(result.data.name, mockCounterparty.name);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.getCounterparty(''),
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
        message: `Counterparty with id ${mockCounterparty.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getCounterparty(mockCounterparty.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for counterparty ID', async () => {
      const mockData = { data: mockCounterparty };
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

      await client.getCounterparty('test-id-123');

      assert.ok(capturedUrl.includes('/counterparties/test-id-123'));
    });
  });

  describe('createCounterparty', () => {
    it('should create new counterparty and return it', async () => {
      const createData: CounterpartyCreateInput = {
        name: 'ООО Тест',
        type: 'supplier',
        inn: '7701234567',
      };

      const mockResponse = { data: { ...mockCounterparty, ...createData } };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createCounterparty(createData);

      assert.strictEqual(result.data.name, createData.name);
      assert.strictEqual(result.data.type, createData.type);
    });

    it('should handle validation error (missing name)', async () => {
      const invalidData: CounterpartyCreateInput = {
        name: '',
        type: 'client',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'name is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createCounterparty(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          return true;
        }
      );
    });

    it('should handle validation error (missing type)', async () => {
      const invalidData: CounterpartyCreateInput = {
        name: 'ООО Тест',
        type: '',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'type is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createCounterparty(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'type is required');
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      const createData: CounterpartyCreateInput = {
        name: 'ООО Тест',
        type: 'client',
      };

      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: mockCounterparty }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createCounterparty(createData);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('updateCounterparty', () => {
    it('should update counterparty and return updated data', async () => {
      const updateData: CounterpartyUpdateInput = {
        name: 'ООО Обновлено',
        notes: 'Updated notes',
      };

      const mockResponse = {
        data: { ...mockCounterparty, ...updateData },
      };

      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.updateCounterparty(mockCounterparty.id, updateData);

      assert.strictEqual(result.data.name, 'ООО Обновлено');
      assert.strictEqual(result.data.notes, 'Updated notes');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateCounterparty('', { name: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when counterparty not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Counterparty with id ${mockCounterparty.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateCounterparty(mockCounterparty.id, { name: 'Test' }),
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
          json: async () => ({ data: mockCounterparty }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateCounterparty(mockCounterparty.id, { name: 'Test' });

      assert.strictEqual(capturedOptions?.method, 'PUT');
    });
  });

  describe('deleteCounterparty', () => {
    it('should soft-delete counterparty and return message', async () => {
      const mockResponse = {
        data: mockCounterparty,
        message: 'Counterparty soft-deleted successfully',
      };

      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteCounterparty(mockCounterparty.id);

      assert.strictEqual(result.data.id, mockCounterparty.id);
      assert.strictEqual(result.message, 'Counterparty soft-deleted successfully');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteCounterparty(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when counterparty not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Counterparty with id ${mockCounterparty.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteCounterparty(mockCounterparty.id),
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
            data: mockCounterparty,
            message: 'Counterparty soft-deleted successfully',
          }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.deleteCounterparty(mockCounterparty.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });
  });

  describe('ApiClientError', () => {
    it('should have correct error properties', () => {
      const error = new ApiClientError(404, 'Not found', 'Resource not found');

      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.error, 'Not found');
      // Note: message property on ApiClientError shadows Error.message
      // The formatted message from super() is: "Not found: Resource not found"
      assert.strictEqual(error.message, 'Resource not found');
      assert.strictEqual(error.name, 'ApiClientError');
    });
  });

  describe('singleton instance', () => {
    it('should export default singleton', () => {
      assert.ok(counterpartiesApi instanceof CounterpartyApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof counterpartiesApi.getCounterparties, 'function');
      assert.strictEqual(typeof counterpartiesApi.getCounterparty, 'function');
      assert.strictEqual(typeof counterpartiesApi.createCounterparty, 'function');
      assert.strictEqual(typeof counterpartiesApi.updateCounterparty, 'function');
      assert.strictEqual(typeof counterpartiesApi.deleteCounterparty, 'function');
    });
  });
});
