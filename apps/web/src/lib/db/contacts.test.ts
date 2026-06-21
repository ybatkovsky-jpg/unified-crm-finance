/**
 * ContactRepository tests
 *
 * Uses tsx for test execution. Creates a test contact in dev.db.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { contacts } from './contacts.js';
import { prisma } from './prisma.js';

describe('ContactRepository', { concurrency: false }, () => {
  // Track created test contact for cleanup
  let testContactId: string;

  it('should create a new contact', async () => {
    // Ensure clean state before first test
    await prisma.contact.deleteMany({
      where: { email: 'test@example.com' },
    });

    const contact = await contacts.create({
      type: 'person',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+79991234567',
      status: 'active',
      tags: ['test', 'tsx-test'],
    });

    assert.ok(contact, 'Contact should be created');
    assert.ok(contact.id, 'Contact should have an ID');
    assert.strictEqual(contact.email, 'test@example.com');
    assert.strictEqual(contact.type, 'person');
    testContactId = contact.id;
  });

  it('should find contact by ID', async () => {
    const contact = await contacts.findUnique(testContactId);
    assert.ok(contact, 'Contact should be found');
    assert.strictEqual(contact?.id, testContactId);
    assert.strictEqual(contact?.email, 'test@example.com');
  });

  it('should find contact by email', async () => {
    const contact = await contacts.findByEmail('test@example.com');
    assert.ok(contact, 'Contact should be found by email');
    assert.strictEqual(contact?.id, testContactId);
  });

  it('should find many contacts', async () => {
    const list = await contacts.findMany({
      where: { type: 'person' },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(Array.isArray(list), 'Result should be an array');
    assert.ok(list.length > 0, 'Array should have items');
    assert.strictEqual(list[0].email, 'test@example.com');
  });

  it('should update a contact', async () => {
    const updated = await contacts.update(testContactId, {
      phone: '+79997654321',
      notes: 'Updated via test',
    });
    assert.strictEqual(updated.phone, '+79997654321');
    assert.strictEqual(updated.notes, 'Updated via test');
  });

  it('should soft delete a contact', async () => {
    const deleted = await contacts.softDelete(testContactId);
    assert.ok(deleted.deletedAt, 'deletedAt should be set');

    // Should not be found via normal queries
    const notFound = await contacts.findUnique(testContactId);
    assert.strictEqual(notFound, null, 'Soft-deleted contact should not be found');

    // But should still exist in database
    const stillExists = await prisma.contact.findUnique({
      where: { id: testContactId },
    });
    assert.ok(stillExists, 'Contact should still exist in DB');
    assert.ok(stillExists?.deletedAt, 'Contact should have deletedAt set');
  });

  it('should check email existence', async () => {
    // Create fresh contact for existence test
    const fresh = await contacts.create({
      type: 'person',
      firstName: 'Fresh',
      lastName: 'Test',
      email: 'freshtest@example.com',
    });

    const exists = await contacts.existsByEmail('freshtest@example.com');
    assert.strictEqual(exists, true, 'Email should exist');

    const notExists = await contacts.existsByEmail('nonexistent@example.com');
    assert.strictEqual(notExists, false, 'Nonexistent email should not exist');

    // Cleanup
    await prisma.contact.delete({ where: { id: fresh.id } });
  });

  it('should count contacts', async () => {
    const count = await contacts.count();
    assert.strictEqual(typeof count, 'number', 'Count should be a number');
    assert.ok(count >= 0, 'Count should be non-negative');
  });

  // Final cleanup
  it('cleanup test data', async () => {
    if (testContactId) {
      await prisma.contact.deleteMany({
        where: { id: testContactId },
      });
    }
    await prisma.$disconnect();
  });
});
