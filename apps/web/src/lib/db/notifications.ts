/**
 * NotificationRepository — CRUD with read/unread management
 */

import { prisma } from './prisma';
import type { Notification, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type NotificationCreateInput = Omit<
  Prisma.NotificationUncheckedCreateInput,
  'id'
> & Partial<Pick<Prisma.NotificationUncheckedCreateInput, 'id'>>;

export class NotificationRepository {
  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  }

  async findByUser(
    userId: string,
    filters?: { unreadOnly?: boolean; type?: string; limit?: number }
  ): Promise<Notification[]> {
    const where: Prisma.NotificationWhereInput = { userId };
    if (filters?.unreadOnly) where.isRead = false;
    if (filters?.type) where.type = filters.type;

    // Явная аннотация типа нужна, чтобы разорвать рекурсивный вывод типов
    // (query-extension $extends → TS2321 excessive stack depth).
    const args: Prisma.NotificationFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 50,
    };
    return prisma.notification.findMany(args);
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async create(data: NotificationCreateInput): Promise<Notification> {
    return prisma.notification.create({
      data: { ...data, id: data.id ?? randomUUID() },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }

  async delete(id: string): Promise<Notification> {
    return prisma.notification.delete({ where: { id } });
  }
}

export const notifications = new NotificationRepository();
export default notifications;
