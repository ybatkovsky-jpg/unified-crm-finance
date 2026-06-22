/**
 * FileRepository - CRUD operations for FileEntity model
 *
 * Provides typed methods for FileEntity queries with soft-delete support.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type {
  FileEntity,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * FileEntity creation input type
 */
export type FileCreateInput = Omit<Prisma.FileEntityUncheckedCreateInput, 'id'> & Partial<Pick<Prisma.FileEntityUncheckedCreateInput, 'id'>>;

/**
 * FileEntity update input type
 */
export type FileUpdateInput = Prisma.FileEntityUncheckedUpdateInput;

/**
 * FileEntity findMany params type
 */
export type FileFindManyParams = {
  where?: Prisma.FileEntityWhereInput;
  orderBy?: Prisma.FileEntityOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.FileEntityInclude;
};

/**
 * Repository for FileEntity CRUD operations
 */
export class FileRepository {
  /**
   * Find many files with optional filtering
   * Automatically filters out soft-deleted records
   */
  async findMany(params?: FileFindManyParams): Promise<FileEntity[]> {
    const { where, ...rest } = params ?? {};

    return prisma.fileEntity.findMany({
      ...rest,
      where: {
        ...where,
        deletedAt: null, // Always exclude soft-deleted
      },
    });
  }

  /**
   * Find a single file by ID
   * Returns null if not found or soft-deleted
   */
  async findUnique(
    id: string,
    include?: Prisma.FileEntityInclude
  ): Promise<FileEntity | null> {
    return prisma.fileEntity.findFirst({
      where: { id, deletedAt: null },
      include,
    });
  }

  /**
   * Find a single file by storage key
   * Returns null if not found or soft-deleted
   */
  async findByStorageKey(storageKey: string): Promise<FileEntity | null> {
    return prisma.fileEntity.findFirst({
      where: { storageKey, deletedAt: null },
    });
  }

  /**
   * Find files uploaded by a specific user
   */
  async findByUploader(userId: string): Promise<FileEntity[]> {
    return prisma.fileEntity.findMany({
      where: { uploadedBy: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new file record
   * Generates UUID if not provided
   * Note: createdAt has @default(now()) in schema
   */
  async create(data: FileCreateInput): Promise<FileEntity> {
    return prisma.fileEntity.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
      },
    });
  }

  /**
   * Update an existing file
   * Throws RecordNotFound if file doesn't exist or is soft-deleted
   */
  async update(
    id: string,
    data: FileUpdateInput
  ): Promise<FileEntity> {
    // Verify file exists and not deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`FileEntity with id ${id} not found`);
    }

    return prisma.fileEntity.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a file by setting deletedAt timestamp
   * Does NOT actually delete the record from database
   */
  async softDelete(id: string): Promise<FileEntity> {
    // Verify file exists and not already deleted
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`FileEntity with id ${id} not found`);
    }

    return prisma.fileEntity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Hard delete a file (permanently remove from database)
   * Use with caution - typically called after storage cleanup
   */
  async hardDelete(id: string): Promise<FileEntity> {
    const existing = await prisma.fileEntity.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error(`FileEntity with id ${id} not found`);
    }

    return prisma.fileEntity.delete({
      where: { id },
    });
  }

  /**
   * Count files matching criteria (excluding soft-deleted)
   */
  async count(where?: Prisma.FileEntityWhereInput): Promise<number> {
    return prisma.fileEntity.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }
}

/**
 * Singleton instance for use across the application
 */
export const files = new FileRepository();

export default files;
