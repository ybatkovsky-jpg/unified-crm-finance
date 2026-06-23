/**
 * Warehouse API Client Tests (S06)
 * Run with: tsx --test src/lib/api/warehouse.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WarehouseApiClient, ApiClientError, warehouseApi, applyTransaction } from './warehouse';
import type { WarehouseItemData, WarehouseTransactionData } from './types';

const mockItem: WarehouseItemData = {
  id: 'wh-001',
  name: 'Widget',
  article: 'W-1',
  category: 'Parts',
  quantity: 100,
  reservedQty: 20,
  availableQty: 80,
  minQuantity: 10,
  unit: 'шт',
  location: 'A-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockTx: WarehouseTransactionData = {
  id: 'whtx-001',
  warehouseItemId: 'wh-001',
  bomItemId: null,
  type: 'in',
  quantity: 50,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function capturingFetch(status: number, ok: boolean, responseData: unknown) {
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
    fetchFn: fetchFn as unknown as typeof globalThis.fetch,
    url: () => _url,
    options: () => _options,
  };
}

describe('WarehouseApiClient', () => {
  it('getItems should GET /warehouse with filters', async () => {
    const mock = capturingFetch(200, true, { data: [mockItem], count: 1 });
    const client = new WarehouseApiClient({ fetch: mock.fetchFn });
    const result = await client.getItems({ search: 'wid', lowStockOnly: true });
    assert.ok(mock.url().includes('/warehouse'));
    assert.ok(mock.url().includes('search=wid'));
    assert.ok(mock.url().includes('lowStockOnly=1'));
    assert.strictEqual(result.count, 1);
  });

  it('getItem should GET /warehouse/[id]', async () => {
    const mock = capturingFetch(200, true, { data: { ...mockItem, transactions: [] } });
    const client = new WarehouseApiClient({ fetch: mock.fetchFn });
    const result = await client.getItem('wh-001');
    assert.ok(mock.url().endsWith('/warehouse/wh-001'));
    assert.strictEqual(result.data.id, mockItem.id);
  });

  it('createItem should POST with body', async () => {
    const mock = capturingFetch(201, true, { data: mockItem });
    const client = new WarehouseApiClient({ fetch: mock.fetchFn });
    await client.createItem({ name: 'Widget', quantity: 100 });
    assert.strictEqual(mock.options()?.method, 'POST');
    assert.strictEqual(JSON.parse(mock.options()?.body as string).name, 'Widget');
  });

  it('updateItem / deleteItem should PATCH/DELETE', async () => {
    const m1 = capturingFetch(200, true, { data: mockItem });
    const c1 = new WarehouseApiClient({ fetch: m1.fetchFn });
    await c1.updateItem('wh-001', { minQuantity: 5 });
    assert.strictEqual(m1.options()?.method, 'PATCH');

    const m2 = capturingFetch(200, true, { data: mockItem, message: 'deleted' });
    const c2 = new WarehouseApiClient({ fetch: m2.fetchFn });
    const r = await c2.deleteItem('wh-001');
    assert.strictEqual(m2.options()?.method, 'DELETE');
    assert.strictEqual(r.message, 'deleted');
  });

  it('applyTransaction should POST transactions with body', async () => {
    const mock = capturingFetch(200, true, { data: mockTx });
    const client = new WarehouseApiClient({ fetch: mock.fetchFn });
    const result = await client.applyTransaction('wh-001', { type: 'in', quantity: 50 });
    assert.strictEqual(mock.options()?.method, 'POST');
    assert.ok(mock.url().endsWith('/warehouse/wh-001/transactions'));
    const body = JSON.parse(mock.options()?.body as string);
    assert.strictEqual(body.type, 'in');
    assert.strictEqual(body.quantity, 50);
    assert.strictEqual(result.data.type, 'in');
  });

  it('should throw ApiClientError on error response', async () => {
    const mock = capturingFetch(400, false, { error: 'Validation failed', message: 'Insufficient' });
    const client = new WarehouseApiClient({ fetch: mock.fetchFn });
    await assert.rejects(
      () => client.applyTransaction('wh-001', { type: 'out', quantity: 9999 }),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.strictEqual((err as ApiClientError).statusCode, 400);
        return true;
      }
    );
  });

  it('should export a singleton and convenience methods', () => {
    assert.ok(warehouseApi instanceof WarehouseApiClient);
    assert.strictEqual(typeof applyTransaction, 'function');
  });
});
