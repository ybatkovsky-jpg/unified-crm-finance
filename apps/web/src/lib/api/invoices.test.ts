/**
 * Invoice API Client Tests (S04)
 * Run with: tsx --test src/lib/api/invoices.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InvoiceApiClient, ApiClientError, invoicesApi, approveInvoice } from './invoices';
import type { InvoiceData, InvoiceItemData } from './types';

const mockInvoice: InvoiceData = {
  id: 'inv-001',
  number: 'INV-2026-AAAAAAAA',
  projectId: 'project-001',
  supplierId: 'supplier-001',
  invoiceNumber: 'SUP-01',
  totalAmount: 1500,
  status: 'received',
  receivedAt: new Date('2026-01-01T00:00:00.000Z'),
  paidAt: null,
  dueDate: null,
  notes: null,
  sourceFileId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockItem: InvoiceItemData = {
  id: 'iitem-001',
  invoiceId: 'inv-001',
  bomItemId: null,
  name: 'Widget',
  quantity: 10,
  price: 150,
  isMatch: false,
  mismatchReason: null,
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

describe('InvoiceApiClient', () => {
  it('getInvoices should GET /invoices with filters', async () => {
    const mock = capturingFetch(200, true, { data: [mockInvoice], count: 1 });
    const client = new InvoiceApiClient({ fetch: mock.fetchFn });
    const result = await client.getInvoices({ projectId: 'project-001', status: 'received' });
    assert.ok(mock.url().includes('/invoices'));
    assert.ok(mock.url().includes('projectId=project-001'));
    assert.ok(mock.url().includes('status=received'));
    assert.strictEqual(result.count, 1);
  });

  it('getInvoice should GET /invoices/[id]', async () => {
    const mock = capturingFetch(200, true, { data: mockInvoice });
    const client = new InvoiceApiClient({ fetch: mock.fetchFn });
    const result = await client.getInvoice('inv-001');
    assert.ok(mock.url().endsWith('/invoices/inv-001'));
    assert.strictEqual(result.data.id, mockInvoice.id);
  });

  it('createInvoice should POST with body', async () => {
    const mock = capturingFetch(201, true, { data: mockInvoice });
    const client = new InvoiceApiClient({ fetch: mock.fetchFn });
    await client.createInvoice({
      projectId: 'project-001',
      supplierId: 'supplier-001',
      items: [{ name: 'Widget', quantity: 10, price: 150 }],
    });
    assert.strictEqual(mock.options()?.method, 'POST');
    const body = JSON.parse(mock.options()?.body as string);
    assert.strictEqual(body.supplierId, 'supplier-001');
    assert.strictEqual(body.items[0].quantity, 10);
  });

  it('updateInvoice / deleteInvoice should PATCH/DELETE', async () => {
    const m1 = capturingFetch(200, true, { data: mockInvoice });
    const c1 = new InvoiceApiClient({ fetch: m1.fetchFn });
    await c1.updateInvoice('inv-001', { notes: 'x' });
    assert.strictEqual(m1.options()?.method, 'PATCH');

    const m2 = capturingFetch(200, true, { data: mockInvoice, message: 'deleted' });
    const c2 = new InvoiceApiClient({ fetch: m2.fetchFn });
    const r = await c2.deleteInvoice('inv-001');
    assert.strictEqual(m2.options()?.method, 'DELETE');
    assert.strictEqual(r.message, 'deleted');
  });

  it('items endpoints: get/add/update/remove', async () => {
    const m1 = capturingFetch(200, true, { data: [mockItem], count: 1 });
    const c1 = new InvoiceApiClient({ fetch: m1.fetchFn });
    const items = await c1.getItems('inv-001');
    assert.strictEqual(items.data[0].id, mockItem.id);

    const m2 = capturingFetch(201, true, { data: mockItem });
    const c2 = new InvoiceApiClient({ fetch: m2.fetchFn });
    await c2.addItem('inv-001', { name: 'X', quantity: 1 });
    assert.strictEqual(m2.options()?.method, 'POST');

    const m3 = capturingFetch(200, true, { data: mockItem });
    const c3 = new InvoiceApiClient({ fetch: m3.fetchFn });
    await c3.updateItem('iitem-001', { quantity: 5 });
    assert.strictEqual(m3.options()?.method, 'PATCH');

    const m4 = capturingFetch(200, true, { data: mockItem, message: 'removed' });
    const c4 = new InvoiceApiClient({ fetch: m4.fetchFn });
    const r = await c4.removeItem('iitem-001');
    assert.ok(m4.url().includes('/invoices/items/iitem-001'));
    assert.strictEqual(r.message, 'removed');
  });

  it('matchItem should POST match with bomItemId', async () => {
    const mock = capturingFetch(200, true, { data: { ...mockItem, isMatch: true } });
    const client = new InvoiceApiClient({ fetch: mock.fetchFn });
    await client.matchItem('iitem-001', 'bomitem-9');
    assert.strictEqual(mock.options()?.method, 'POST');
    assert.ok(mock.url().includes('/invoices/items/iitem-001/match'));
    assert.strictEqual(JSON.parse(mock.options()?.body as string).bomItemId, 'bomitem-9');
  });

  it('unmatchItem / recomputeStatus / approve / status endpoints', async () => {
    const mk = () => capturingFetch(200, true, { data: mockInvoice });
    const c1 = new InvoiceApiClient({ fetch: mk().fetchFn });
    await c1.unmatchItem('iitem-1');
    const c2 = new InvoiceApiClient({ fetch: mk().fetchFn });
    await c2.recomputeStatus('inv-1');
    const c3 = new InvoiceApiClient({ fetch: mk().fetchFn });
    await c3.approveInvoice('inv-1');
    const m4 = capturingFetch(200, true, { data: { ...mockInvoice, status: 'verified' } });
    const c4 = new InvoiceApiClient({ fetch: m4.fetchFn });
    const r = await c4.updateStatus('inv-1', 'verified');
    assert.strictEqual(m4.options()?.method, 'PATCH');
    assert.strictEqual(JSON.parse(m4.options()?.body as string).status, 'verified');
    assert.strictEqual(r.data.status, 'verified');
  });

  it('should throw ApiClientError on error response', async () => {
    const mock = capturingFetch(404, false, { error: 'Not found', message: 'Invoice not found' });
    const client = new InvoiceApiClient({ fetch: mock.fetchFn });
    await assert.rejects(
      () => client.getInvoice('missing'),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.strictEqual((err as ApiClientError).statusCode, 404);
        return true;
      }
    );
  });

  it('should export a singleton and convenience methods', () => {
    assert.ok(invoicesApi instanceof InvoiceApiClient);
    assert.strictEqual(typeof approveInvoice, 'function');
  });
});
