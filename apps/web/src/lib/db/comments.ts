/**
 * CommentRepository — CRUD для полиморфных комментариев (модель Comment).
 * relatedEntityType/relatedEntityId позволяют привязывать комментарии к любой сущности.
 */

import { prisma } from './prisma';
import type { Comment, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { User: { select: { id: true; name: true; email: true } } };
}>;

export class CommentRepository {
  /** Список комментариев сущности (новые сверху). */
  async findByEntity(entityType: string, entityId: string): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { relatedEntityType: entityType, relatedEntityId: entityId },
      include: {
        User: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Создать комментарий. */
  async create(input: {
    content: string;
    authorId: string;
    entityType: string;
    entityId: string;
  }): Promise<Comment> {
    return prisma.comment.create({
      data: {
        id: randomUUID(),
        content: input.content,
        authorId: input.authorId,
        relatedEntityType: input.entityType,
        relatedEntityId: input.entityId,
        updatedAt: new Date(),
      },
    });
  }
}

export const comments = new CommentRepository();
export default comments;
