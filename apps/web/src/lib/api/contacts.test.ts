/**
 * Contact API Client Tests
 *
 * Tests for ContactApiClient with mocked fetch.
 * Run with: tsx --test src/lib/api/contacts.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ContactApiClient, ApiClientError, contactsApi } from './contacts';
import type { ContactData, ContactCreateInput, ContactUpdateInput } from './types';

/**
 * Mock contact data
 */
const mockContact: ContactData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'person',
  firstName: 'John',
  lastName: 'Doe',
  middleName: null,
  companyName: null,
  inn: null,
  kpp: null,
  ogrn: null,
  email: 'john@example.com',
  phone: '+1234567890',
  address: null,
  physicalAddress: null,
  position: null,
  notes: null,
  sourceId: null,
  ownerId: null,
  status: 'active',
  tags: ['vip', 'customer'],
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

describe('ContactApiClient', () => {
  let client: ContactApiClient;

  beforeEach(() => {
    client = new ContactApiClient();
  });

  describe('getContacts', () => {
    it('should return contacts list', async () => {
      const mockData = {
        data: [mockContact],
        count: 1,
      };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContacts();

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].id, mockContact.id);
      assert.strictEqual(result.count, 1);
    });

    it('should pass type filter in query params', async () => {
      const mockData = { data: [mockContact], count: 1 };
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

      await client.getContacts({ type: 'person' });

      assert.ok(capturedUrl.includes('type=person'));
    });

    it('should pass status filter in query params', async () => {
      const mockData = { data: [mockContact], count: 1 };
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

      await client.getContacts({ status: 'active' });

      assert.ok(capturedUrl.includes('status=active'));
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch contacts',
        message: 'Database connection error',
      };

      client.fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getContacts(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch contacts');
          return true;
        }
      );
    });

    it('should handle empty response', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContacts();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('getContact', () => {
    it('should return single contact by ID', async () => {
      const mockData = { data: mockContact };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContact(mockContact.id);

      assert.strictEqual(result.data.id, mockContact.id);
      assert.strictEqual(result.data.firstName, mockContact.firstName);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.getContact(''),
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
        message: `Contact with id ${mockContact.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getContact(mockContact.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for contact ID', async () => {
      const mockData = { data: mockContact };
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

      await client.getContact('test-id-123');

      assert.ok(capturedUrl.includes('/contacts/test-id-123'));
    });
  });

  describe('createContact', () => {
    it('should create new contact and return it', async () => {
      const createData: ContactCreateInput = {
        type: 'person',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+9876543210',
      };

      const mockResponse = { data: { ...mockContact, ...createData } };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createContact(createData);

      assert.strictEqual(result.data.firstName, createData.firstName);
      assert.strictEqual(result.data.lastName, createData.lastName);
    });

    it('should handle validation error (missing firstName for person)', async () => {
      const invalidData: ContactCreateInput = {
        type: 'person',
        phone: '+1234567890',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'firstName is required for person contacts',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createContact(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          return true;
        }
      );
    });

    it('should handle validation error (missing companyName for company)', async () => {
      const invalidData: ContactCreateInput = {
        type: 'company',
        phone: '+1234567890',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'companyName is required for company contacts',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createContact(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          return true;
        }
      );
    });

    it('should handle missing phone error', async () => {
      const invalidData: ContactCreateInput = {
        type: 'person',
        firstName: 'John',
        phone: '',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'phone is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createContact(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'phone is required');
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      const createData: ContactCreateInput = {
        type: 'person',
        firstName: 'Test',
        phone: '+1234567890',
      };

      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: mockContact }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createContact(createData);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('updateContact', () => {
    it('should update contact and return updated data', async () => {
      const updateData: ContactUpdateInput = {
        firstName: 'Updated',
        notes: 'Updated notes',
      };

      const mockResponse = {
        data: { ...mockContact, ...updateData },
      };

      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.updateContact(mockContact.id, updateData);

      assert.strictEqual(result.data.firstName, 'Updated');
      assert.strictEqual(result.data.notes, 'Updated notes');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateContact('', { firstName: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when contact not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Contact with id ${mockContact.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateContact(mockContact.id, { firstName: 'Test' }),
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
          json: async () => ({ data: mockContact }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateContact(mockContact.id, { firstName: 'Test' });

      assert.strictEqual(capturedOptions?.method, 'PUT');
    });
  });

  describe('deleteContact', () => {
    it('should soft-delete contact and return message', async () => {
      const mockResponse = {
        data: mockContact,
        message: 'Contact soft-deleted successfully',
      };

      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteContact(mockContact.id);

      assert.strictEqual(result.data.id, mockContact.id);
      assert.strictEqual(result.message, 'Contact soft-deleted successfully');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteContact(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when contact not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Contact with id ${mockContact.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteContact(mockContact.id),
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
            data: mockContact,
            message: 'Contact soft-deleted successfully',
          }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.deleteContact(mockContact.id);

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
      assert.ok(contactsApi instanceof ContactApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof contactsApi.getContacts, 'function');
      assert.strictEqual(typeof contactsApi.getContact, 'function');
      assert.strictEqual(typeof contactsApi.createContact, 'function');
      assert.strictEqual(typeof contactsApi.updateContact, 'function');
      assert.strictEqual(typeof contactsApi.deleteContact, 'function');
    });
  });
});
