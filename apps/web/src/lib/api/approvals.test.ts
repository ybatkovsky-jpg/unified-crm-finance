/**
 * ApprovalRequest API Client Tests (S05)
 * Run with: tsx --test src/lib/api/approvals.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ApprovalRequestApiClient,
  ApiClientError,
  approvalsApi,
  decideApproval,
} from './approvals';
import type { ApprovalRequestData } from './types';

const mockApproval: ApprovalRequestData = {
  id: 'appr-001',
  type: 'payment',
  entityId: 'inv-001',
  status: 'pending',
  amount: 5000,
  requestedBy: 'manager',
  decidedBy: null,
  requestedAt: new Date('2026-01-01T00:00:00.000Z'),
  decidedAt: null,
  comment: null,
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

describe('ApprovalRequestApiClient', () => {
  it('getApprovals should GET /approvals with filters', async () => {
    const mock = capturingFetch(200, true, { data: [mockApproval], count: 1 });
    const client = new ApprovalRequestApiClient({ fetch: mock.fetchFn });
    const result = await client.getApprovals({ status: 'pending', type: 'payment' });
    assert.ok(mock.url().includes('/approvals'));
    assert.ok(mock.url().includes('status=pending'));
    assert.ok(mock.url().includes('type=payment'));
    assert.strictEqual(result.count, 1);
  });

  it('getApproval should GET /approvals/[id]', async () => {
    const mock = capturingFetch(200, true, { data: mockApproval });
    const client = new ApprovalRequestApiClient({ fetch: mock.fetchFn });
    const result = await client.getApproval('appr-001');
    assert.ok(mock.url().endsWith('/approvals/appr-001'));
    assert.strictEqual(result.data.id, mockApproval.id);
  });

  it('createApproval should POST with body', async () => {
    const mock = capturingFetch(201, true, { data: mockApproval });
    const client = new ApprovalRequestApiClient({ fetch: mock.fetchFn });
    await client.createApproval({
      type: 'payment',
      entityId: 'inv-001',
      amount: 5000,
      requestedBy: 'manager',
    });
    assert.strictEqual(mock.options()?.method, 'POST');
    const body = JSON.parse(mock.options()?.body as string);
    assert.strictEqual(body.type, 'payment');
    assert.strictEqual(body.entityId, 'inv-001');
  });

  it('decideApproval should POST /decide with decision + decidedBy', async () => {
    const mock = capturingFetch(200, true, { data: { ...mockApproval, status: 'approved' } });
    const client = new ApprovalRequestApiClient({ fetch: mock.fetchFn });
    const result = await client.decideApproval('appr-001', {
      decision: 'approved',
      decidedBy: 'owner',
      comment: 'ok',
    });
    assert.strictEqual(mock.options()?.method, 'POST');
    assert.ok(mock.url().endsWith('/approvals/appr-001/decide'));
    const body = JSON.parse(mock.options()?.body as string);
    assert.strictEqual(body.decision, 'approved');
    assert.strictEqual(result.data.status, 'approved');
  });

  it('should throw ApiClientError on error response', async () => {
    const mock = capturingFetch(404, false, { error: 'Not found', message: 'Approval not found' });
    const client = new ApprovalRequestApiClient({ fetch: mock.fetchFn });
    await assert.rejects(
      () => client.getApproval('missing'),
      (err: unknown) => {
        assert.ok(err instanceof ApiClientError);
        assert.strictEqual((err as ApiClientError).statusCode, 404);
        return true;
      }
    );
  });

  it('should export a singleton and convenience methods', () => {
    assert.ok(approvalsApi instanceof ApprovalRequestApiClient);
    assert.strictEqual(typeof decideApproval, 'function');
  });
});
