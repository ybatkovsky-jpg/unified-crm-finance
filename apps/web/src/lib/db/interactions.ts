/**
 * InteractionRepository - CRUD operations for Interaction model
 *
 * Provides typed methods for Interaction queries.
 * All errors propagate to caller for handling at API layer.
 */

import { prisma } from './prisma';
import type {
  Interaction,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

/**
 * Interaction creation input type
 */
export type InteractionCreateInput = Omit<Prisma.InteractionUncheckedCreateInput, 'id' | 'updatedAt'> & Partial<Pick<Prisma.InteractionUncheckedCreateInput, 'id' | 'updatedAt'>>;

/**
 * Interaction update input type
 */
export type InteractionUpdateInput = Prisma.InteractionUncheckedUpdateInput;

/**
 * Interaction findMany params type
 */
export type InteractionFindManyParams = {
  where?: Prisma.InteractionWhereInput;
  orderBy?: Prisma.InteractionOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.InteractionInclude;
};

/**
 * Repository for Interaction CRUD operations
 */
export class InteractionRepository {
  /**
   * Find many interactions with optional filtering
   * Defaults to createdAt descending order
   */
  async findMany(params?: InteractionFindManyParams): Promise<Interaction[]> {
    const { where, orderBy, ...rest } = params ?? {};

    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends + спред локального типа → TS2321 excessive stack depth).
    const args: Prisma.InteractionFindManyArgs = {
      ...rest,
      where,
      orderBy: orderBy ?? { createdAt: 'desc' },
    };

    return prisma.interaction.findMany(args);
  }

  /**
   * Find a single interaction by ID
   * Returns null if not found
   */
  async findUnique<I extends Prisma.InteractionInclude>(
    id: string,
    include?: I
  ): Promise<Prisma.InteractionGetPayload<{ include: I }> | null> {
    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends + спред локального типа → TS2321 excessive stack depth).
    const args: Prisma.InteractionFindUniqueArgs = {
      where: { id },
      include,
    };
    return prisma.interaction.findUnique(args) as Promise<
      Prisma.InteractionGetPayload<{ include: I }> | null
    >;
  }

  /**
   * Find interactions for a specific contact, ordered by createdAt desc
   */
  async findByContactId(contactId: string): Promise<Interaction[]> {
    return prisma.interaction.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new interaction
   * Generates UUID and updatedAt if not provided
   * Note: createdAt has @default(now()) in schema
   */
  async create(data: InteractionCreateInput): Promise<Interaction> {
    return prisma.interaction.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
    });
  }

  /**
   * Update an existing interaction
   * Throws if interaction doesn't exist
   */
  async update(
    id: string,
    data: InteractionUpdateInput
  ): Promise<Interaction> {
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Interaction with id ${id} not found`);
    }

    return prisma.interaction.update({
      where: { id },
      data,
    });
  }

  /**
   * Hard delete an interaction
   * Throws if interaction doesn't exist
   */
  async delete(id: string): Promise<Interaction> {
    const existing = await this.findUnique(id);
    if (!existing) {
      throw new Error(`Interaction with id ${id} not found`);
    }

    return prisma.interaction.delete({
      where: { id },
    });
  }

  /**
   * Count interactions matching criteria
   */
  async count(where?: Prisma.InteractionWhereInput): Promise<number> {
    return prisma.interaction.count({ where });
  }
}

/**
 * Singleton instance for use across the application
 */
export const interactions = new InteractionRepository();

export default interactions;
