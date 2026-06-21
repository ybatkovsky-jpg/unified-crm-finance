/**
 * Contract API Client Tests
 *
 * Tests for ContractApiClient with mocked fetch.
 * Run with: tsx --test src/lib/api/contracts.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ContractApiClient, ApiClientError, contractsApi } from './contracts';
import type { ContractData, ContractCreateInput, ContractUpdateInput, ContractVersionCreateInput, ContractSignerCreateInput, DealConvertInput } from './types';

/**
 * Mock contract data
 */
const mockContract: ContractData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Service Agreement',
  contactId: '660e8400-e29b-41d4-a716-446655440000',
  dealId: '770e8400-e29b-41d4-a716-446655440000',
  templateId: null,
  amount: 10000,
  currency: 'USD',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  status: 'draft',
  notes: 'Important contract',
  attributes: { key: 'value' },
  signedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  contact: null,
  deal: null,
  template: null,
  versions: [],
  signers: [],
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

describe('ContractApiClient', () => {
  let client: ContractApiClient;

  beforeEach(() => {
    client = new ContractApiClient();
  });

  describe('getContracts', () => {
    it('should return contracts list with count', async () => {
      const mockData = {
        data: [mockContract],
        count: 1,
      };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContracts();

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].id, mockContract.id);
      assert.strictEqual(result.count, 1);
    });

    it('should pass status filter in query params', async () => {
      const mockData = { data: [mockContract], count: 1 };
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

      await client.getContracts({ status: 'active' });

      assert.ok(capturedUrl.includes('status=active'));
    });

    it('should pass contactId filter in query params', async () => {
      const mockData = { data: [mockContract], count: 1 };
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

      await client.getContracts({ contactId: 'contact-123' });

      assert.ok(capturedUrl.includes('contactId=contact-123'));
    });

    it('should pass dealId filter in query params', async () => {
      const mockData = { data: [mockContract], count: 1 };
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

      await client.getContracts({ dealId: 'deal-123' });

      assert.ok(capturedUrl.includes('dealId=deal-123'));
    });

    it('should skip undefined params in query string', async () => {
      const mockData = { data: [mockContract], count: 1 };
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

      await client.getContracts({ status: undefined, contactId: undefined, dealId: undefined });

      assert.ok(!capturedUrl.includes('status='));
      assert.ok(!capturedUrl.includes('contactId='));
      assert.ok(!capturedUrl.includes('dealId'));
    });

    it('should handle API error response', async () => {
      const mockError = {
        error: 'Failed to fetch contracts',
        message: 'Database connection error',
      };

      client.fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getContracts(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Failed to fetch contracts');
          return true;
        }
      );
    });

    it('should handle empty response', async () => {
      const mockData = { data: [], count: 0 };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContracts();

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('getContract', () => {
    it('should return single contract by ID', async () => {
      const mockData = { data: mockContract };
      client.fetchFn = createMockFetch(mockData);

      const result = await client.getContract(mockContract.id);

      assert.strictEqual(result.data.id, mockContract.id);
      assert.strictEqual(result.data.title, mockContract.title);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.getContract(''),
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
        message: `Contract with id ${mockContract.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getContract(mockContract.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 404);
          assert.strictEqual(apiError.error, 'Not found');
          return true;
        }
      );
    });

    it('should build correct URL for contract ID', async () => {
      const mockData = { data: mockContract };
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

      await client.getContract('test-id-123');

      assert.ok(capturedUrl.includes('/contracts/test-id-123'));
    });
  });

  describe('createContract', () => {
    it('should create new contract and return it', async () => {
      const createData: ContractCreateInput = {
        title: 'New Contract',
        contactId: 'contact-123',
        amount: 5000,
        currency: 'EUR',
      };

      const mockResponse = { data: { ...mockContract, ...createData } };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.createContract(createData);

      assert.strictEqual(result.data.title, createData.title);
      assert.strictEqual(result.data.amount, createData.amount);
    });

    it('should send POST request', async () => {
      const createData: ContractCreateInput = {
        title: 'Test Contract',
        contactId: 'contact-123',
      };

      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: mockContract }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.createContract(createData);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });

    it('should handle validation error (400)', async () => {
      const invalidData: ContractCreateInput = {
        title: '',
        contactId: '',
      };

      const mockError = {
        error: 'Validation failed',
        message: 'title is required',
      };

      client.fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createContract(invalidData),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Validation failed');
          return true;
        }
      );
    });
  });

  describe('updateContract', () => {
    it('should update contract and return updated data', async () => {
      const updateData: ContractUpdateInput = {
        title: 'Updated Contract',
        status: 'signed',
        notes: 'Updated notes',
      };

      const mockResponse = {
        data: { ...mockContract, ...updateData },
      };

      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.updateContract(mockContract.id, updateData);

      assert.strictEqual(result.data.title, 'Updated Contract');
      assert.strictEqual(result.data.status, 'signed');
      assert.strictEqual(result.data.notes, 'Updated notes');
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateContract('', { title: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when contract not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Contract with id ${mockContract.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateContract(mockContract.id, { title: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send PATCH request', async () => {
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockContract }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.updateContract(mockContract.id, { title: 'Test' });

      assert.strictEqual(capturedOptions?.method, 'PATCH');
    });
  });

  describe('deleteContract', () => {
    it('should delete contract and return deleted data', async () => {
      const mockResponse = { data: mockContract };
      client.fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteContract(mockContract.id);

      assert.strictEqual(result.data.id, mockContract.id);
    });

    it('should throw error when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteContract(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when contract not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Contract with id ${mockContract.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteContract(mockContract.id),
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
          json: async () => ({ data: mockContract }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.deleteContract(mockContract.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });
  });

  describe('getVersions', () => {
    it('should return contract versions list', async () => {
      const mockVersions = [
        { id: 'v1', contentMd: 'Version 1', number: 1 },
        { id: 'v2', contentMd: 'Version 2', number: 2 },
      ];
      const mockData = { data: mockVersions, count: 2 };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getVersions(mockContract.id);

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.data[0].id, 'v1');
    });

    it('should build correct URL for versions', async () => {
      const mockData = { data: [], count: 0 };
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

      await client.getVersions('contract-123');

      assert.ok(capturedUrl.includes('/contracts/contract-123/versions'));
    });

    it('should handle 404 when contract not found', async () => {
      const mockError = {
        error: 'Not found',
        message: `Contract with id ${mockContract.id} not found`,
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getVersions(mockContract.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 404);
          return true;
        }
      );
    });
  });

  describe('addVersion', () => {
    it('should add new version to contract', async () => {
      const versionData: ContractVersionCreateInput = {
        contentMd: '# New Version',
        createdBy: 'user-123',
        generatedPdfFileId: 'file-456',
      };

      const mockVersion = {
        id: 'v-new',
        contentMd: versionData.contentMd,
        number: 2,
      };

      const mockResponse = { data: mockVersion };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.addVersion(mockContract.id, versionData);

      assert.strictEqual(result.data.id, 'v-new');
      assert.strictEqual(result.data.contentMd, versionData.contentMd);
    });

    it('should send POST request to versions endpoint', async () => {
      const versionData: ContractVersionCreateInput = {
        contentMd: '# Test',
        createdBy: 'user-123',
      };

      let capturedUrl = '';
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (url, options) => {
        capturedUrl = url.toString();
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: { id: 'v-new' } }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.addVersion('contract-123', versionData);

      assert.ok(capturedUrl.includes('/contracts/contract-123/versions'));
      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('getSigners', () => {
    it('should return contract signers list', async () => {
      const mockSigners = [
        { id: 's1', name: 'John Doe', position: 'CEO' },
        { id: 's2', name: 'Jane Smith', position: 'CFO' },
      ];
      const mockData = { data: mockSigners, count: 2 };

      client.fetchFn = createMockFetch(mockData);

      const result = await client.getSigners(mockContract.id);

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.data[0].name, 'John Doe');
    });

    it('should build correct URL for signers', async () => {
      const mockData = { data: [], count: 0 };
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

      await client.getSigners('contract-123');

      assert.ok(capturedUrl.includes('/contracts/contract-123/signers'));
    });
  });

  describe('addSigner', () => {
    it('should add new signer to contract', async () => {
      const signerData: ContractSignerCreateInput = {
        name: 'New Signer',
        position: 'Director',
        signatureFileId: 'file-789',
      };

      const mockSigner = {
        id: 's-new',
        name: signerData.name,
        position: signerData.position,
      };

      const mockResponse = { data: mockSigner };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.addSigner(mockContract.id, signerData);

      assert.strictEqual(result.data.id, 's-new');
      assert.strictEqual(result.data.name, 'New Signer');
    });

    it('should send POST request to signers endpoint', async () => {
      const signerData: ContractSignerCreateInput = {
        name: 'Test Signer',
      };

      let capturedUrl = '';
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (url, options) => {
        capturedUrl = url.toString();
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: { id: 's-new' } }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.addSigner('contract-123', signerData);

      assert.ok(capturedUrl.includes('/contracts/contract-123/signers'));
      assert.strictEqual(capturedOptions?.method, 'POST');
    });

    it('should handle signer with optional position', async () => {
      const signerData: ContractSignerCreateInput = {
        name: 'Simple Signer',
        position: null,
      };

      const mockResponse = { data: { id: 's-new', name: signerData.name } };
      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.addSigner(mockContract.id, signerData);

      assert.strictEqual(result.data.name, 'Simple Signer');
    });
  });

  describe('convertDeal', () => {
    it('should convert deal to contract', async () => {
      const convertData: DealConvertInput = {
        title: 'Converted Contract',
        amount: 15000,
        currency: 'GBP',
      };

      const mockDeal = {
        id: 'deal-123',
        title: 'Original Deal',
      };

      const mockResponse = {
        data: {
          contract: { ...mockContract, title: convertData.title },
          deal: mockDeal,
        },
      };

      client.fetchFn = createMockFetch(mockResponse, 201);

      const result = await client.convertDeal('deal-123', convertData);

      assert.strictEqual(result.data.contract.title, 'Converted Contract');
      assert.strictEqual(result.data.deal.id, 'deal-123');
    });

    it('should build correct URL for deal conversion', async () => {
      const mockData = { data: { contract: mockContract, deal: {} } };
      let capturedUrl = '';

      client.fetchFn = async (url) => {
        capturedUrl = url.toString();
        return {
          ok: true,
          status: 201,
          json: async () => mockData,
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.convertDeal('deal-456', {});

      assert.ok(capturedUrl.includes('/deals/deal-456/convert'));
    });

    it('should send POST request to convert endpoint', async () => {
      const convertData: DealConvertInput = { title: 'Test' };
      let capturedOptions: RequestInit | undefined;

      client.fetchFn = async (_url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: { contract: mockContract, deal: {} } }),
          headers: { get: () => 'application/json' },
        } as Response;
      };

      await client.convertDeal('deal-123', convertData);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });

    it('should handle 404 when deal not found', async () => {
      const mockError = {
        error: 'Not found',
        message: 'Deal with id deal-999 not found',
      };

      client.fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.convertDeal('deal-999', {}),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 404);
          return true;
        }
      );
    });
  });

  describe('Network errors', () => {
    it('should handle fetch rejection', async () => {
      client.fetchFn = async () => {
        throw new Error('Network error');
      };

      await assert.rejects(
        async () => client.getContracts(),
        (err: Error) => {
          assert.strictEqual(err.message, 'Network error');
          return true;
        }
      );
    });

    it('should handle non-JSON responses', async () => {
      client.fetchFn = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Unexpected token');
          },
          headers: {
            get: () => null,
          },
        } as Response;
      };

      await assert.rejects(
        async () => client.getContracts(),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Invalid response');
          return true;
        }
      );
    });

    it('should handle API error with non-JSON response', async () => {
      client.fetchFn = async () => {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
          headers: {
            get: () => 'text/html',
          },
        } as Response;
      };

      await assert.rejects(
        async () => client.getContract('test-id'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          const apiError = err as ApiClientError;
          assert.strictEqual(apiError.statusCode, 500);
          assert.strictEqual(apiError.error, 'Unknown error');
          return true;
        }
      );
    });
  });

  describe('singleton instance', () => {
    it('should export default singleton', () => {
      assert.ok(contractsApi instanceof ContractApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof contractsApi.getContracts, 'function');
      assert.strictEqual(typeof contractsApi.getContract, 'function');
      assert.strictEqual(typeof contractsApi.createContract, 'function');
      assert.strictEqual(typeof contractsApi.updateContract, 'function');
      assert.strictEqual(typeof contractsApi.deleteContract, 'function');
      assert.strictEqual(typeof contractsApi.getVersions, 'function');
      assert.strictEqual(typeof contractsApi.addVersion, 'function');
      assert.strictEqual(typeof contractsApi.getSigners, 'function');
      assert.strictEqual(typeof contractsApi.addSigner, 'function');
      assert.strictEqual(typeof contractsApi.convertDeal, 'function');
    });
  });
});
