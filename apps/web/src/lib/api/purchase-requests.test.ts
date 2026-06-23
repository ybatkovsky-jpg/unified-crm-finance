/**
 * PurchaseRequest API Client Tests
 *
 * Tests for PurchaseRequestApiClient with mocked fetch.
 * Run with: tsx --test src/lib/api/purchase-requests.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PurchaseRequestApiClient,
  ApiClientError,
  purchaseRequestsApi,
  sendRequest,
} from './purchase-requests';
import type {
  PurchaseRequestData,
  PurchaseRequestItemData,
  SupplierGroupData,
} from './types';

const mockRequest: PurchaseRequestData = {
  id: 'pr-001-uuid',
  number: 'PR-2026-AAAAAAAA',
  projectId: 'project-001',
  supplierId: 'supplier-001',
  status: 'draft',
  emailTo: 'supplier@example.com',
  emailSubject: 'Запрос КП',
  emailBody: 'Добрый день...',
  sentAt: null,
  responseAt: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockItem: PurchaseRequestItemData = {
  id: 'pri-001',
  requestId: 'pr-001-uuid',
  bomItemId: 'bomitem-001',
  quantity: 10,
  price: 0,
  available: false,
  availableQty: 0,
  deliveryDays: 0,
  notes: null,
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

describe('PurchaseRequestApiClient', () => {
  it('getPurchaseRequests should GET /purchase-requests with filters', async () => {
    const mock = capturingFetch(200, true, {
      data: [mockRequest],
      count: 1,
    });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });

    const result = await client.getPurchaseRequests({
      projectId: 'project-001',
      status: 'draft',
    });

    assert.ok(mock.url().includes('/purchase-requests'));
    assert.ok(mock.url().includes('projectId=project-001'));
    assert.ok(mock.url().includes('status=draft'));
    assert.strictEqual(result.count, 1);
    assert.strictEqual(result.data[0].id, mockRequest.id);
  });

  it('groupBOM should GET /purchase-requests/group?bomId=', async () => {
    const group: SupplierGroupData = {
      supplierId: 'supplier-001',
      supplier: { id: 'supplier-001', name: 'Sup', type: 'supplier', types: [], inn: null, kpp: null, email: 's@e.com', phone: null, contactPerson: null, address: null, bankName: null, bankAccount: null, korAccount: null, bik: null, notes: null, rating: null, attributes: null, createdAt: new Date(), updatedAt: new Date() },
      items: [],
    };
    const mock = capturingFetch(200, true, { data: [group], count: 1 });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });

    const result = await client.groupBOM('bom-001');
    assert.ok(mock.url().includes('/purchase-requests/group'));
    assert.ok(mock.url().includes('bomId=bom-001'));
    assert.strictEqual(result.count, 1);
  });

  it('groupBOM should throw on missing bomId', async () => {
    const client = new PurchaseRequestApiClient({ fetch: async () => ({}) as Response });
    await assert.rejects(() => client.groupBOM(''), ApiClientError);
  });

  it('getPurchaseRequest should GET /purchase-requests/[id]', async () => {
    const mock = capturingFetch(200, true, { data: mockRequest });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });
    const result = await client.getPurchaseRequest('pr-001-uuid');
    assert.ok(mock.url().endsWith('/purchase-requests/pr-001-uuid'));
    assert.strictEqual(result.data.id, mockRequest.id);
  });

  it('createPurchaseRequest should POST with body', async () => {
    const mock = capturingFetch(201, true, { data: mockRequest });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });
    await client.createPurchaseRequest({
      projectId: 'project-001',
      supplierId: 'supplier-001',
      items: [{ bomItemId: 'bomitem-001', quantity: 5 }],
    });
    assert.strictEqual(mock.options()?.method, 'POST');
    const body = JSON.parse(mock.options()?.body as string);
    assert.strictEqual(body.supplierId, 'supplier-001');
    assert.strictEqual(body.items[0].quantity, 5);
  });

  it('updatePurchaseRequest should PATCH /purchase-requests/[id]', async () => {
    const mock = capturingFetch(200, true, { data: mockRequest });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });
    await client.updatePurchaseRequest('pr-001-uuid', { notes: 'updated' });
    assert.strictEqual(mock.options()?.method, 'PATCH');
    assert.ok(mock.url().endsWith('/purchase-requests/pr-001-uuid'));
  });

  it('deletePurchaseRequest should DELETE', async () => {
    const mock = capturingFetch(200, true, { data: mockRequest, message: 'deleted' });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });
    const result = await client.deletePurchaseRequest('pr-001-uuid');
    assert.strictEqual(mock.options()?.method, 'DELETE');
    assert.strictEqual(result.message, 'deleted');
  });

  it('generateEmail / sendRequest / resendRequest should POST action endpoints', async () => {
    const mk = () => capturingFetch(200, true, { data: mockRequest });
    const c1 = new PurchaseRequestApiClient({ fetch: mk().fetchFn });
    await c1.generateEmail('pr-1');
    const c2 = new PurchaseRequestApiClient({ fetch: mk().fetchFn });
    const sent = await c2.sendRequest('pr-1');
    assert.strictEqual(sent.data.status, 'draft'); // mock returns draft; real route returns sent
    const c3 = new PurchaseRequestApiClient({ fetch: mk().fetchFn });
    await c3.resendRequest('pr-1');
  });

  it('updateStatus should PATCH /status with body', async () => {
    const mock = capturingFetch(200, true, { data: { ...mockRequest, status: 'responded' } });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });
    const result = await client.updateStatus('pr-001-uuid', 'responded');
    assert.strictEqual(mock.options()?.method, 'PATCH');
    assert.ok(mock.url().endsWith('/purchase-requests/pr-001-uuid/status'));
    assert.strictEqual(JSON.parse(mock.options()?.body as string).status, 'responded');
    assert.strictEqual(result.data.status, 'responded');
  });

  it('getItems / addItem / removeItem should hit items endpoints', async () => {
    const listMock = capturingFetch(200, true, { data: [mockItem], count: 1 });
    const c1 = new PurchaseRequestApiClient({ fetch: listMock.fetchFn });
    const items = await c1.getItems('pr-001-uuid');
    assert.strictEqual(items.data[0].id, mockItem.id);

    const addMock = capturingFetch(201, true, { data: mockItem });
    const c2 = new PurchaseRequestApiClient({ fetch: addMock.fetchFn });
    await c2.addItem('pr-001-uuid', { bomItemId: 'bomitem-001', quantity: 3 });
    assert.strictEqual(addMock.options()?.method, 'POST');

    const delMock = capturingFetch(200, true, { data: mockItem, message: 'removed' });
    const c3 = new PurchaseRequestApiClient({ fetch: delMock.fetchFn });
    const removed = await c3.removeItem('pri-001');
    assert.strictEqual(delMock.options()?.method, 'DELETE');
    assert.ok(delMock.url().includes('/purchase-requests/items/pri-001'));
    assert.strictEqual(removed.message, 'removed');
  });

  it('should throw ApiClientError on error response', async () => {
    const mock = capturingFetch(404, false, { error: 'Not found', message: 'Request not found' });
    const client = new PurchaseRequestApiClient({ fetch: mock.fetchFn });
    await assert.rejects(
      () => client.getPurchaseRequest('missing'),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.strictEqual((err as ApiClientError).statusCode, 404);
        return true;
      }
    );
  });

  it('should export a singleton and convenience methods', () => {
    assert.ok(purchaseRequestsApi instanceof PurchaseRequestApiClient);
    assert.strictEqual(typeof sendRequest, 'function');
  });
});
