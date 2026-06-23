/**
 * BOM API Client Tests
 *
 * Tests for BOMApiClient with mocked fetch.
 * Run with: tsx --test src/lib/api/bom.test.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BOMApiClient, ApiClientError, bomApi } from './bom';
import type { BOMData, BOMItemData, BOMCreateInput, BOMItemCreateInput, BOMItemUpdateInput } from './types';

const mockBOM: BOMData = {
  id: 'bom-001-uuid-1234',
  projectId: 'project-001-uuid',
  sourceFileId: null,
  status: 'draft',
  version: 1,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockBOMItem: BOMItemData = {
  id: 'item-001-uuid-1234',
  bomId: 'bom-001-uuid-1234',
  rowNumber: 1,
  name: 'Кабель силовой',
  article: 'КС-001',
  category: 'Кабельная продукция',
  quantity: 100,
  unit: 'м',
  price: 250.50,
  supplierId: null,
  status: 'pending',
  isFromWarehouse: false,
  notes: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  supplier: null,
};

function createMockFetch(responseData: unknown, status = 200, ok = true) {
  return async () => {
    return {
      ok,
      status,
      json: async () => responseData,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
    } as unknown as Response;
  };
}

function createCapturingFetch(
  status: number,
  ok: boolean,
  responseData: unknown
): { fetchFn: (...args: unknown[]) => Promise<Response>; capturedUrl: () => string; capturedOptions: () => RequestInit | undefined } {
  let _url = '';
  let _options: RequestInit | undefined;

  const fetchFn = async (url: string, options?: RequestInit) => {
    _url = url.toString();
    _options = options;
    return {
      ok,
      status,
      json: async () => responseData,
      headers: { get: () => 'application/json' },
    } as unknown as Response;
  };

  return {
    fetchFn,
    capturedUrl: () => _url,
    capturedOptions: () => _options,
  };
}

describe('BOMApiClient', () => {
  let client: BOMApiClient;

  beforeEach(() => {
    client = new BOMApiClient();
  });

  describe('getBOM', () => {
    it('should return BOM by projectId', async () => {
      const mockData = { data: { ...mockBOM, items: [mockBOMItem] } };
      (client as any).fetchFn = createMockFetch(mockData);

      const result = await client.getBOM('project-001-uuid');

      assert.strictEqual(result.data.id, mockBOM.id);
      assert.strictEqual(result.data.projectId, 'project-001-uuid');
      assert.strictEqual(result.data.items?.length, 1);
    });

    it('should throw when projectId is empty', async () => {
      await assert.rejects(
        async () => client.getBOM(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'projectId is required');
          return true;
        }
      );
    });

    it('should handle 404 when BOM not found', async () => {
      const mockError = { error: 'Not found', message: 'BOM not found for project' };
      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getBOM('nonexistent-project'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 404);
          return true;
        }
      );
    });

    it('should handle 500 server error', async () => {
      const mockError = { error: 'Internal error', message: 'Database connection error' };
      (client as any).fetchFn = createMockFetch(mockError, 500, false);

      await assert.rejects(
        async () => client.getBOM('project-001-uuid'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 500);
          return true;
        }
      );
    });
  });

  describe('getBOMById', () => {
    it('should return BOM by ID', async () => {
      const mockData = { data: { ...mockBOM, items: [mockBOMItem] } };
      (client as any).fetchFn = createMockFetch(mockData);

      const result = await client.getBOMById(mockBOM.id);

      assert.strictEqual(result.data.id, mockBOM.id);
      assert.strictEqual(result.data.items?.length, 1);
    });

    it('should throw when ID is empty', async () => {
      await assert.rejects(
        async () => client.getBOMById(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 response', async () => {
      const mockError = { error: 'Not found', message: `BOM with id ${mockBOM.id} not found` };
      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getBOMById(mockBOM.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });
  });

  describe('createBOM', () => {
    it('should create BOM and return it', async () => {
      const createData: BOMCreateInput = {
        projectId: 'project-001-uuid',
        sourceFileId: 'file-001-uuid',
        items: [
          { rowNumber: 1, name: 'Кабель', quantity: 100, price: 500 },
        ],
      };

      const mockResponse = { data: { ...mockBOM, projectId: createData.projectId, sourceFileId: createData.sourceFileId } };
      let capturedBody: string | undefined;

      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedBody = options.body as string;
        return {
          ok: true,
          status: 201,
          json: async () => mockResponse,
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      const result = await client.createBOM(createData);

      assert.strictEqual(result.data.projectId, createData.projectId);
      assert.strictEqual(result.data.sourceFileId, createData.sourceFileId);
      assert.ok(capturedBody);
      const parsed = JSON.parse(capturedBody!);
      assert.strictEqual(parsed.projectId, createData.projectId);
      assert.strictEqual(parsed.items.length, 1);
    });

    it('should handle 400 validation error', async () => {
      const mockError = { error: 'Validation failed', message: 'projectId is required' };
      (client as any).fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.createBOM({ projectId: '' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 400);
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: mockBOM }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.createBOM({ projectId: 'project-001-uuid' });

      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('updateBOM', () => {
    it('should update BOM status and return updated data', async () => {
      const mockResponse = { data: { ...mockBOM, status: 'locked' } };
      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.updateBOM(mockBOM.id, { status: 'locked' });

      assert.strictEqual(result.data.status, 'locked');
    });

    it('should throw when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateBOM('', { status: 'locked' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when BOM not found', async () => {
      const mockError = { error: 'Not found', message: `BOM with id ${mockBOM.id} not found` };
      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateBOM(mockBOM.id, { status: 'locked' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send PATCH request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockBOM }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.updateBOM(mockBOM.id, { status: 'locked' });

      assert.strictEqual(capturedOptions?.method, 'PATCH');
    });
  });

  describe('deleteBOM', () => {
    it('should delete BOM and return message', async () => {
      const mockResponse = { data: mockBOM, message: 'BOM deleted successfully' };
      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteBOM(mockBOM.id);

      assert.strictEqual(result.data.id, mockBOM.id);
      assert.strictEqual(result.message, 'BOM deleted successfully');
    });

    it('should throw when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteBOM(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when BOM not found', async () => {
      const mockError = { error: 'Not found', message: `BOM with id ${mockBOM.id} not found` };
      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteBOM(mockBOM.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send DELETE request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockBOM, message: 'BOM deleted successfully' }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.deleteBOM(mockBOM.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });
  });

  describe('lockBOM', () => {
    it('should lock BOM and return updated data', async () => {
      const mockResponse = { data: { ...mockBOM, status: 'locked' } };
      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.lockBOM(mockBOM.id);

      assert.strictEqual(result.data.status, 'locked');
    });

    it('should throw when ID is empty', async () => {
      await assert.rejects(
        async () => client.lockBOM(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 400 when already locked', async () => {
      const mockError = { error: 'Conflict', message: 'BOM is already locked' };
      (client as any).fetchFn = createMockFetch(mockError, 409, false);

      await assert.rejects(
        async () => client.lockBOM(mockBOM.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 409);
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockBOM }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.lockBOM(mockBOM.id);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });

    it('should hit correct URL for lock endpoint', async () => {
      const { fetchFn, capturedUrl } = createCapturingFetch(200, true, { data: mockBOM });
      (client as any).fetchFn = fetchFn;

      await client.lockBOM(mockBOM.id);

      assert.ok(capturedUrl().includes(`/bom/${mockBOM.id}/lock`));
    });
  });

  describe('unlockBOM', () => {
    it('should unlock BOM and return updated data', async () => {
      const mockResponse = { data: { ...mockBOM, status: 'draft' } };
      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.unlockBOM(mockBOM.id);

      assert.strictEqual(result.data.status, 'draft');
    });

    it('should throw when ID is empty', async () => {
      await assert.rejects(
        async () => client.unlockBOM(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockBOM }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.unlockBOM(mockBOM.id);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('getBOMItems', () => {
    it('should return items for a BOM', async () => {
      const mockItems = { data: [mockBOMItem], count: 1 };
      (client as any).fetchFn = createMockFetch(mockItems);

      const result = await client.getBOMItems(mockBOM.id);

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].name, 'Кабель силовой');
      assert.strictEqual(result.count, 1);
    });

    it('should throw when bomId is empty', async () => {
      await assert.rejects(
        async () => client.getBOMItems(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'bomId is required');
          return true;
        }
      );
    });

    it('should handle 404 when BOM not found', async () => {
      const mockError = { error: 'Not found', message: 'BOM not found' };
      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.getBOMItems('nonexistent'),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 404);
          return true;
        }
      );
    });

    it('should return empty items list', async () => {
      const mockItems = { data: [], count: 0 };
      (client as any).fetchFn = createMockFetch(mockItems);

      const result = await client.getBOMItems(mockBOM.id);

      assert.deepStrictEqual(result.data, []);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('addBOMItems', () => {
    it('should add items to BOM and return them', async () => {
      const items: BOMItemCreateInput[] = [
        { rowNumber: 1, name: 'Кабель', quantity: 50, price: 300 },
        { rowNumber: 2, name: 'Розетка', quantity: 20, price: 150 },
      ];

      const mockResponse = {
        data: [
          { ...mockBOMItem, rowNumber: 1, name: 'Кабель' },
          { ...mockBOMItem, rowNumber: 2, name: 'Розетка' },
        ],
        count: 2,
      };

      let capturedBody: string | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedBody = options.body as string;
        return {
          ok: true,
          status: 201,
          json: async () => mockResponse,
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      const result = await client.addBOMItems(mockBOM.id, items);

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.count, 2);
      const parsed = JSON.parse(capturedBody!);
      assert.ok(parsed.items);
      assert.strictEqual(parsed.items.length, 2);
    });

    it('should throw when bomId is empty', async () => {
      await assert.rejects(
        async () => client.addBOMItems('', [{ rowNumber: 1, name: 'Test', quantity: 1 }]),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'bomId is required');
          return true;
        }
      );
    });

    it('should handle 400 validation error', async () => {
      const mockError = { error: 'Validation failed', message: 'items array is required' };
      (client as any).fetchFn = createMockFetch(mockError, 400, false);

      await assert.rejects(
        async () => client.addBOMItems(mockBOM.id, []),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).statusCode, 400);
          return true;
        }
      );
    });

    it('should send POST request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 201,
          json: async () => ({ data: [mockBOMItem], count: 1 }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.addBOMItems(mockBOM.id, [{ rowNumber: 1, name: 'Test', quantity: 1 }]);

      assert.strictEqual(capturedOptions?.method, 'POST');
    });
  });

  describe('updateBOMItem', () => {
    it('should update BOM item and return updated data', async () => {
      const updateData: BOMItemUpdateInput = {
        name: 'Кабель обновленный',
        quantity: 150,
        price: 275,
      };

      const mockResponse = { data: { ...mockBOMItem, ...updateData } };
      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.updateBOMItem(mockBOMItem.id, updateData);

      assert.strictEqual(result.data.name, 'Кабель обновленный');
      assert.strictEqual(result.data.quantity, 150);
      assert.strictEqual(result.data.price, 275);
    });

    it('should throw when ID is empty', async () => {
      await assert.rejects(
        async () => client.updateBOMItem('', { name: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when item not found', async () => {
      const mockError = { error: 'Not found', message: 'BOMItem not found' };
      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.updateBOMItem(mockBOMItem.id, { name: 'Test' }),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send PATCH request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockBOMItem }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.updateBOMItem(mockBOMItem.id, { name: 'Test' });

      assert.strictEqual(capturedOptions?.method, 'PATCH');
    });
  });

  describe('deleteBOMItem', () => {
    it('should delete BOM item and return message', async () => {
      const mockResponse = { data: mockBOMItem, message: 'BOMItem deleted successfully' };
      (client as any).fetchFn = createMockFetch(mockResponse);

      const result = await client.deleteBOMItem(mockBOMItem.id);

      assert.strictEqual(result.data.id, mockBOMItem.id);
      assert.strictEqual(result.message, 'BOMItem deleted successfully');
    });

    it('should throw when ID is empty', async () => {
      await assert.rejects(
        async () => client.deleteBOMItem(''),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).message, 'id is required');
          return true;
        }
      );
    });

    it('should handle 404 when item not found', async () => {
      const mockError = { error: 'Not found', message: 'BOMItem not found' };
      (client as any).fetchFn = createMockFetch(mockError, 404, false);

      await assert.rejects(
        async () => client.deleteBOMItem(mockBOMItem.id),
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.strictEqual((err as ApiClientError).error, 'Not found');
          return true;
        }
      );
    });

    it('should send DELETE request', async () => {
      let capturedOptions: RequestInit | undefined;
      (client as any).fetchFn = async (_url: string, options: RequestInit) => {
        capturedOptions = options;
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: mockBOMItem, message: 'BOMItem deleted successfully' }),
          headers: { get: () => 'application/json' },
        } as unknown as Response;
      };

      await client.deleteBOMItem(mockBOMItem.id);

      assert.strictEqual(capturedOptions?.method, 'DELETE');
    });
  });

  describe('singleton instance', () => {
    it('should export default singleton', () => {
      assert.ok(bomApi instanceof BOMApiClient);
    });

    it('should export convenience methods', () => {
      assert.strictEqual(typeof bomApi.getBOM, 'function');
      assert.strictEqual(typeof bomApi.getBOMById, 'function');
      assert.strictEqual(typeof bomApi.createBOM, 'function');
      assert.strictEqual(typeof bomApi.updateBOM, 'function');
      assert.strictEqual(typeof bomApi.deleteBOM, 'function');
      assert.strictEqual(typeof bomApi.lockBOM, 'function');
      assert.strictEqual(typeof bomApi.unlockBOM, 'function');
      assert.strictEqual(typeof bomApi.getBOMItems, 'function');
      assert.strictEqual(typeof bomApi.addBOMItems, 'function');
      assert.strictEqual(typeof bomApi.updateBOMItem, 'function');
      assert.strictEqual(typeof bomApi.deleteBOMItem, 'function');
    });
  });
});
