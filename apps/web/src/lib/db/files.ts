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
   */
  async findMany(params?: FileFindManyParams): Promise<FileEntity[]> {
    const { where, ...rest } = params ?? {};

    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends + спред локального типа → TS2321 excessive stack depth).
    const args: Prisma.FileEntityFindManyArgs = {
      ...rest,
      where: where ?? undefined,
    };

    return prisma.fileEntity.findMany(args);
  }

  /**
   * Find a single file by ID
   */
  async findUnique<I extends Prisma.FileEntityInclude>(
    id: string,
    include?: I
  ): Promise<Prisma.FileEntityGetPayload<{ include: I }> | null> {
    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends + спред локального типа → TS2321 excessive stack depth).
    const args: Prisma.FileEntityFindFirstArgs = {
      where: { id },
      include,
    };
    return prisma.fileEntity.findFirst(args) as Promise<
      Prisma.FileEntityGetPayload<{ include: I }> | null
    >;
  }

  /**
   * Find a single file by storage key
   */
  async findByStorageKey(storageKey: string): Promise<FileEntity | null> {
    return prisma.fileEntity.findFirst({
      where: { storageKey },
    });
  }

  /**
   * Find files uploaded by a specific user
   */
  async findByUploader(userId: string): Promise<FileEntity[]> {
    return prisma.fileEntity.findMany({
      where: { uploadedBy: userId },
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
   * Delete a file.
   * Note: FileEntity has no `deletedAt` column, so this is a hard delete.
   * Kept as `softDelete` for API compatibility with the DELETE /api/files/[id] route.
   */
  async softDelete(id: string): Promise<FileEntity> {
    // Verify file exists
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`FileEntity with id ${id} not found`);
    }

    return prisma.fileEntity.delete({
      where: { id },
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
   * Count files matching criteria
   */
  async count(where?: Prisma.FileEntityWhereInput): Promise<number> {
    return prisma.fileEntity.count({
      where: where ?? undefined,
    });
  }
}

/**
 * Singleton instance for use across the application
 */
export const files = new FileRepository();

export default files;
