/**
 * CounterpartyRepository tests
 *
 * Uses tsx for test execution. Creates test data in dev.db.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { counterparties } from './counterparties.js';
import { prisma } from './prisma.js';

describe('CounterpartyRepository', { concurrency: false }, () => {
  let testSupplierId: string;

  it('should create a new counterparty', async () => {
    // Ensure clean state before first test
    await prisma.counterparty.deleteMany({
      where: { inn: '7707083893' },
    });

    const cp = await counterparties.create({
      name: 'ООО ТестСнаб',
      type: 'supplier',
      inn: '7707083893',
      kpp: '770701001',
      email: 'info@testsnab.ru',
      phone: '+74951234567',
      contactPerson: 'Иванов Иван',
      address: 'г. Москва, ул. Тестовая, д. 1',
      bankName: 'Сбербанк',
      bankAccount: '40702810800000000001',
      korAccount: '30101810400000000225',
      bik: '044525225',
      notes: 'Test supplier',
    });

    assert.ok(cp, 'Counterparty should be created');
    assert.ok(cp.id, 'Counterparty should have an ID');
    assert.strictEqual(cp.name, 'ООО ТестСнаб');
    assert.strictEqual(cp.type, 'supplier');
    assert.strictEqual(cp.inn, '7707083893');
    assert.strictEqual(cp.bankName, 'Сбербанк');
    assert.strictEqual(cp.bankAccount, '40702810800000000001');
    testSupplierId = cp.id;
  });

  it('should find counterparty by ID', async () => {
    const cp = await counterparties.findUnique(testSupplierId);
    assert.ok(cp, 'Counterparty should be found');
    assert.strictEqual(cp?.id, testSupplierId);
    assert.strictEqual(cp?.name, 'ООО ТестСнаб');
  });

  it('should find counterparty by INN', async () => {
    const cp = await counterparties.findByInn('7707083893');
    assert.ok(cp, 'Counterparty should be found by INN');
    assert.strictEqual(cp?.id, testSupplierId);

    const notFound = await counterparties.findByInn('0000000000');
    assert.strictEqual(notFound, null, 'Nonexistent INN should return null');
  });

  it('should find counterparties by type', async () => {
    const list = await counterparties.findByType('supplier');
    assert.ok(Array.isArray(list), 'Result should be an array');
    assert.ok(list.length > 0, 'Should find at least one supplier');
    assert.ok(list.every(cp => cp.type === 'supplier'), 'All results should be suppliers');
  });

  it('should find many counterparties', async () => {
    const list = await counterparties.findMany({
      where: { type: 'supplier' },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(Array.isArray(list), 'Result should be an array');
    assert.ok(list.length > 0, 'Array should have items');
    assert.strictEqual(list[0].name, 'ООО ТестСнаб');
  });

  it('should update a counterparty', async () => {
    const updated = await counterparties.update(testSupplierId, {
      phone: '+74959876543',
      notes: 'Updated via test',
      rating: 5,
    });
    assert.strictEqual(updated.phone, '+74959876543');
    assert.strictEqual(updated.notes, 'Updated via test');
    assert.strictEqual(updated.rating, 5);
  });

  it('should throw when updating a non-existent counterparty', async () => {
    await assert.rejects(
      () => counterparties.update('non-existent-id', { name: 'Test' }),
      /Counterparty with id non-existent-id not found/
    );
  });

  it('should soft delete a counterparty', async () => {
    const deleted = await counterparties.softDelete(testSupplierId);
    assert.ok(deleted.deletedAt, 'deletedAt should be set');

    // Should not be found via normal queries
    const notFound = await counterparties.findUnique(testSupplierId);
    assert.strictEqual(notFound, null, 'Soft-deleted counterparty should not be found');

    // But should still exist in database
    const stillExists = await prisma.counterparty.findUnique({
      where: { id: testSupplierId },
    });
    assert.ok(stillExists, 'Counterparty should still exist in DB');
    assert.ok(stillExists?.deletedAt, 'Counterparty should have deletedAt set');
  });

  it('should throw when soft-deleting an already-deleted counterparty', async () => {
    await assert.rejects(
      () => counterparties.softDelete(testSupplierId),
      /Counterparty with id .+ not found/
    );
  });

  it('should count counterparties', async () => {
    const count = await counterparties.count();
    assert.strictEqual(typeof count, 'number', 'Count should be a number');
    assert.ok(count >= 0, 'Count should be non-negative');
  });

  it('should check INN existence', async () => {
    // Create fresh counterparty for existence test
    const fresh = await counterparties.create({
      name: 'ООО СвежийТест',
      type: 'supplier',
      inn: '7707083894',
    });

    const exists = await counterparties.existsByInn('7707083894');
    assert.strictEqual(exists, true, 'INN should exist');

    const notExists = await counterparties.existsByInn('0000000000');
    assert.strictEqual(notExists, false, 'Nonexistent INN should not exist');

    // Soft-deleted INN should not exist
    const deletedExists = await counterparties.existsByInn('7707083893');
    assert.strictEqual(deletedExists, false, 'Soft-deleted INN should not exist');

    // Cleanup
    await prisma.counterparty.delete({ where: { id: fresh.id } });
  });

  // Final cleanup
  it('cleanup test data', async () => {
    if (testSupplierId) {
      await prisma.counterparty.deleteMany({
        where: { id: testSupplierId },
      });
    }
    await prisma.$disconnect();
  });
});
