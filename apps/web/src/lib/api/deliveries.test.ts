/**
 * Delivery API Client Tests (S07)
 * Run with: tsx --test src/lib/api/deliveries.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DeliveryApiClient, ApiClientError, deliveriesApi, updateStatus } from './deliveries';
import type { DeliveryData } from './types';

const mockDelivery: DeliveryData = {
  id: 'del-001',
  projectId: 'project-001',
  supplierId: 'supplier-001',
  invoiceId: 'inv-001',
  status: 'pending',
  trackingNumber: null,
  carrier: null,
  estimatedDate: null,
  actualDate: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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

describe('DeliveryApiClient', () => {
  it('getDeliveries should GET /deliveries with filters', async () => {
    const mock = capturingFetch(200, true, { data: [mockDelivery], count: 1 });
    const client = new DeliveryApiClient({ fetch: mock.fetchFn });
    const result = await client.getDeliveries({ projectId: 'project-001', status: 'pending' });
    assert.ok(mock.url().includes('/deliveries'));
    assert.ok(mock.url().includes('projectId=project-001'));
    assert.ok(mock.url().includes('status=pending'));
    assert.strictEqual(result.count, 1);
  });

  it('getDelivery should GET /deliveries/[id]', async () => {
    const mock = capturingFetch(200, true, { data: mockDelivery });
    const client = new DeliveryApiClient({ fetch: mock.fetchFn });
    const result = await client.getDelivery('del-001');
    assert.ok(mock.url().endsWith('/deliveries/del-001'));
    assert.strictEqual(result.data.id, mockDelivery.id);
  });

  it('createDelivery should POST with body', async () => {
    const mock = capturingFetch(201, true, { data: mockDelivery });
    const client = new DeliveryApiClient({ fetch: mock.fetchFn });
    await client.createDelivery({ projectId: 'p', supplierId: 's', invoiceId: 'inv-001' });
    assert.strictEqual(mock.options()?.method, 'POST');
    assert.strictEqual(JSON.parse(mock.options()?.body as string).invoiceId, 'inv-001');
  });

  it('updateDelivery should PATCH', async () => {
    const mock = capturingFetch(200, true, { data: mockDelivery });
    const client = new DeliveryApiClient({ fetch: mock.fetchFn });
    await client.updateDelivery('del-001', { trackingNumber: 'T-1' });
    assert.strictEqual(mock.options()?.method, 'PATCH');
  });

  it('updateStatus should PATCH /status with body', async () => {
    const mock = capturingFetch(200, true, { data: { ...mockDelivery, status: 'shipped' } });
    const client = new DeliveryApiClient({ fetch: mock.fetchFn });
    const result = await client.updateStatus('del-001', 'shipped');
    assert.strictEqual(mock.options()?.method, 'PATCH');
    assert.ok(mock.url().endsWith('/deliveries/del-001/status'));
    assert.strictEqual(JSON.parse(mock.options()?.body as string).status, 'shipped');
    assert.strictEqual(result.data.status, 'shipped');
  });

  it('should throw ApiClientError on error response', async () => {
    const mock = capturingFetch(400, false, { error: 'Validation failed', message: 'Invalid transition' });
    const client = new DeliveryApiClient({ fetch: mock.fetchFn });
    await assert.rejects(
      () => client.updateStatus('del-001', 'pending'),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.strictEqual((err as ApiClientError).statusCode, 400);
        return true;
      }
    );
  });

  it('should export a singleton and convenience methods', () => {
    assert.ok(deliveriesApi instanceof DeliveryApiClient);
    assert.strictEqual(typeof updateStatus, 'function');
  });
});
