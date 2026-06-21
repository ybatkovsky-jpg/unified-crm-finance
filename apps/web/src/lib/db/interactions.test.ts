/**
 * InteractionRepository tests
 *
 * Uses tsx for test execution. Creates test data in dev.db.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { interactions } from './interactions.js';
import { prisma } from './prisma.js';
import { randomUUID } from 'node:crypto';

describe('InteractionRepository', { concurrency: false }, () => {
  let testUserId: string;
  let testContactId: string;
  let testInteractionId: string;

  before(async () => {
    // Clean up any leftover test data
    await prisma.interaction.deleteMany({
      where: { subject: { startsWith: '[test]' } },
    });
    await prisma.contact.deleteMany({
      where: { email: 'interaction-test@example.com' },
    });
    await prisma.user.deleteMany({
      where: { email: 'interaction-test@example.com' },
    });

    // Create test User (authorId FK requires a User)
    testUserId = randomUUID();
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'interaction-test@example.com',
        name: 'Interaction Tester',
        passwordHash: '$2b$10$placeholderhashfortesting1234567890abcdef',
        updatedAt: new Date(),
      },
    });

    // Create test Contact
    testContactId = randomUUID();
    await prisma.contact.create({
      data: {
        id: testContactId,
        type: 'person',
        firstName: 'Interaction',
        lastName: 'Test',
        email: 'interaction-test@example.com',
        updatedAt: new Date(),
      },
    });
  });

  it('should create an interaction', async () => {
    const interaction = await interactions.create({
      contactId: testContactId,
      type: 'call',
      direction: 'outbound',
      subject: '[test] Initial call',
      content: 'Discussed project requirements',
      authorId: testUserId,
    });

    assert.ok(interaction, 'Interaction should be created');
    assert.ok(interaction.id, 'Interaction should have an ID');
    assert.strictEqual(interaction.type, 'call');
    assert.strictEqual(interaction.direction, 'outbound');
    assert.strictEqual(interaction.contactId, testContactId);
    assert.strictEqual(interaction.authorId, testUserId);
    assert.ok(interaction.createdAt, 'createdAt should be auto-set');
    assert.ok(interaction.updatedAt, 'updatedAt should be set');
    testInteractionId = interaction.id;
  });

  it('should find interaction by ID', async () => {
    const interaction = await interactions.findUnique(testInteractionId);
    assert.ok(interaction, 'Interaction should be found');
    assert.strictEqual(interaction?.id, testInteractionId);
    assert.strictEqual(interaction?.type, 'call');
    assert.strictEqual(interaction?.subject, '[test] Initial call');
  });

  it('should return null for non-existent ID', async () => {
    const interaction = await interactions.findUnique('non-existent-id');
    assert.strictEqual(interaction, null);
  });

  it('should find interactions by contactId', async () => {
    // Create a second interaction for the same contact to test ordering
    await interactions.create({
      contactId: testContactId,
      type: 'email',
      direction: 'inbound',
      subject: '[test] Follow-up email',
      content: 'Thanks for the call',
      authorId: testUserId,
    });

    const list = await interactions.findByContactId(testContactId);
    assert.ok(Array.isArray(list), 'Result should be an array');
    assert.ok(list.length >= 2, 'Should have at least 2 interactions');
    // Should be ordered by createdAt desc — newest first
    assert.strictEqual(list[0].type, 'email', 'Newest interaction should be first');
    assert.strictEqual(list[1].type, 'call', 'Oldest interaction should be last');
    // All should belong to the test contact
    for (const item of list) {
      assert.strictEqual(item.contactId, testContactId);
    }
  });

  it('should find many interactions with custom filter', async () => {
    const list = await interactions.findMany({
      where: { type: 'call' },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 0);
    for (const item of list) {
      assert.strictEqual(item.type, 'call');
    }
  });

  it('should update an interaction', async () => {
    const updated = await interactions.update(testInteractionId, {
      content: 'Updated content after meeting',
      subject: '[test] Initial call — updated',
    });
    assert.strictEqual(updated.content, 'Updated content after meeting');
    assert.strictEqual(updated.subject, '[test] Initial call — updated');
  });

  it('should throw when updating non-existent interaction', async () => {
    await assert.rejects(
      () => interactions.update('non-existent-id', { content: 'test' }),
      /not found/
    );
  });

  it('should hard delete an interaction', async () => {
    // Create an interaction specifically for deletion
    const toDelete = await interactions.create({
      contactId: testContactId,
      type: 'note',
      subject: '[test] To be deleted',
      authorId: testUserId,
    });

    const deleted = await interactions.delete(toDelete.id);
    assert.strictEqual(deleted.id, toDelete.id);

    // Should not be found after deletion
    const notFound = await interactions.findUnique(toDelete.id);
    assert.strictEqual(notFound, null, 'Interaction should be gone after hard delete');
  });

  it('should throw when deleting non-existent interaction', async () => {
    await assert.rejects(
      () => interactions.delete('non-existent-id'),
      /not found/
    );
  });

  it('should verify cascade delete on contact delete', async () => {
    // Create a dedicated contact + interaction for cascade test
    const cascadeContactId = randomUUID();
    await prisma.contact.create({
      data: {
        id: cascadeContactId,
        type: 'person',
        firstName: 'Cascade',
        lastName: 'Test',
        email: 'cascade-test@example.com',
        updatedAt: new Date(),
      },
    });

    const cascadeInteraction = await interactions.create({
      contactId: cascadeContactId,
      type: 'meeting',
      subject: '[test] Cascade interaction',
      authorId: testUserId,
    });
    assert.ok(cascadeInteraction.id);

    // Delete the contact — should cascade delete the interaction
    await prisma.contact.delete({ where: { id: cascadeContactId } });

    const shouldBeGone = await interactions.findUnique(cascadeInteraction.id);
    assert.strictEqual(shouldBeGone, null, 'Interaction should be cascade-deleted with contact');
  });

  it('should count interactions', async () => {
    const total = await interactions.count();
    assert.strictEqual(typeof total, 'number');
    assert.ok(total >= 0, 'Total count should be non-negative');

    const callCount = await interactions.count({ type: 'call' });
    assert.strictEqual(typeof callCount, 'number');
    assert.ok(callCount >= 1, 'Should have at least 1 call interaction');

    const nonexistent = await interactions.count({ type: 'nonexistent-type' });
    assert.strictEqual(nonexistent, 0, 'Filter for nonexistent type should return 0');
  });

  after(async () => {
    // Clean up test data
    await prisma.interaction.deleteMany({
      where: { authorId: testUserId },
    });
    await prisma.contact.deleteMany({
      where: { email: 'interaction-test@example.com' },
    });
    await prisma.user.deleteMany({
      where: { email: 'interaction-test@example.com' },
    });
    await prisma.$disconnect();
  });
});
