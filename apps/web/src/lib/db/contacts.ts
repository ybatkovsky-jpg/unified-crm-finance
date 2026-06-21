/**
 * ContactRepository - CRUD operations for Contact model
 *
 * Provides typed methods for Contact queries with soft-delete support.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type {
  Contact,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * Contact creation input type
 */
export type ContactCreateInput = Omit<Prisma.ContactUncheckedCreateInput, 'id' | 'updatedAt'> & Partial<Pick<Prisma.ContactUncheckedCreateInput, 'id' | 'updatedAt'>>;

/**
 * Contact update input type
 */
export type ContactUpdateInput = Prisma.ContactUncheckedUpdateInput;

/**
 * Contact findMany params type
 */
export type ContactFindManyParams = {
  where?: Prisma.ContactWhereInput;
  orderBy?: Prisma.ContactOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.ContactInclude;
};

/**
 * Repository for Contact CRUD operations
 */
export class ContactRepository {
  /**
   * Find many contacts with optional filtering
   * Automatically filters out soft-deleted records
   */
  async findMany(params?: ContactFindManyParams): Promise<Contact[]> {
    const { where, ...rest } = params ?? {};

    return prisma.contact.findMany({
      ...rest,
      where: {
        ...where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  /**
   * Find a single contact by ID
   * Returns null if not found or soft-deleted
   */
  async findUnique(
    id: string,
    include?: Prisma.ContactInclude
  ): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include,
    });
  }

  /**
   * Find a single contact by unique fields (email, phone, inn)
   * Returns null if not found or soft-deleted
   */
  async findByEmail(email: string): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findByPhone(phone: string): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: { phone, deletedAt: null },
    });
  }

  async findByInn(inn: string): Promise<Contact | null> {
    return prisma.contact.findFirst({
      where: { inn, deletedAt: null },
    });
  }

  /**
   * Create a new contact
   * Generates UUID and updatedAt if not provided (schema requires these fields)
   * Note: createdAt has @default(now()) in schema
   */
  async create(data: ContactCreateInput): Promise<Contact> {
    return prisma.contact.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Update an existing contact
   * Throws RecordNotFound if contact doesn't exist or is soft-deleted
   */
  async update(
    id: string,
    data: ContactUpdateInput
  ): Promise<Contact> {
    // Verify contact exists and not deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Contact with id ${id} not found`);
    }

    return prisma.contact.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a contact by setting deletedAt timestamp
   * Does NOT actually delete the record from database
   */
  async softDelete(id: string): Promise<Contact> {
    // Verify contact exists and not already deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Contact with id ${id} not found`);
    }

    return prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Count contacts matching criteria (excluding soft-deleted)
   */
  async count(where?: Prisma.ContactWhereInput): Promise<number> {
    return prisma.contact.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Check if a contact exists by email (excluding soft-deleted)
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.contact.count({
      where: { email, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * Check if a contact exists by phone (excluding soft-deleted)
   */
  async existsByPhone(phone: string): Promise<boolean> {
    const count = await prisma.contact.count({
      where: { phone, deletedAt: null },
    });
    return count > 0;
  }
}

/**
 * Singleton instance for use across the application
 */
export const contacts = new ContactRepository();

export default contacts;
