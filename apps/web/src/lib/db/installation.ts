/**
 * InstallationRepository — progressive installation tracking (PROJ-10)
 *
 * Status machine: planned → advance_paid → started → completed (+ cancelled)
 *
 * Handles multi-entry installation visits per project with advance payment tracking.
 */

import { prisma } from './prisma';
import type { Installation, InstallationWorker, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ValidationError } from './errors';

export type InstallationStatus = 'planned' | 'advance_paid' | 'started' | 'completed' | 'cancelled';

const VALID_TRANSITIONS: Record<InstallationStatus, InstallationStatus[]> = {
  planned: ['advance_paid', 'started', 'cancelled'],
  advance_paid: ['started', 'cancelled'],
  started: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const VALID_STATUSES: InstallationStatus[] = ['planned', 'advance_paid', 'started', 'completed', 'cancelled'];

export type InstallationCreateInput = {
  projectId: string;
  number?: number;
  plannedStartDate?: Date | string;
  advancePercent?: number;
  advanceAmount?: number;
  cost?: number;
  notes?: string;
};

export type InstallationUpdateInput = {
  plannedStartDate?: Date | string | null;
  advancePercent?: number | null;
  advanceAmount?: number | null;
  cost?: number | null;
  notes?: string | null;
};

export class InstallationRepository {
  async create(data: InstallationCreateInput): Promise<Installation> {
    // Auto-increment number within project
    const count = await prisma.installation.count({
      where: { projectId: data.projectId },
    });

    return prisma.installation.create({
      data: {
        id: randomUUID(),
        projectId: data.projectId,
        number: data.number ?? count + 1,
        status: 'planned',
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : null,
        advancePercent: data.advancePercent ?? 30,
        advanceAmount: data.advanceAmount ?? null,
        cost: data.cost ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<Installation | null> {
    return prisma.installation.findUnique({
      where: { id },
      include: {
        InstallationWorker: {
          include: { User: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async findByProject(projectId: string): Promise<Installation[]> {
    return prisma.installation.findMany({
      where: { projectId },
      orderBy: { number: 'asc' },
      include: {
        InstallationWorker: {
          include: { User: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async update(id: string, data: InstallationUpdateInput): Promise<Installation> {
    const updateData: Prisma.InstallationUpdateInput = {
      updatedAt: new Date(),
    };

    if (data.plannedStartDate !== undefined) {
      updateData.plannedStartDate = data.plannedStartDate ? new Date(data.plannedStartDate) : null;
    }
    if (data.advancePercent !== undefined && data.advancePercent !== null) updateData.advancePercent = data.advancePercent;
    if (data.advanceAmount !== undefined) updateData.advanceAmount = data.advanceAmount;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.installation.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<Installation> {
    return prisma.installation.delete({ where: { id } });
  }

  async transitionStatus(id: string, newStatus: InstallationStatus): Promise<Installation> {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new ValidationError(`Invalid status: ${newStatus}`);
    }

    const inst = await prisma.installation.findUnique({ where: { id } });
    if (!inst) throw new ValidationError('Installation not found');

    const allowed = VALID_TRANSITIONS[inst.status as InstallationStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition: ${inst.status} → ${newStatus}`
      );
    }

    const updateData: Prisma.InstallationUpdateInput = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'started') {
      updateData.actualStartDate = new Date();
    }
    if (newStatus === 'completed') {
      updateData.actualEndDate = new Date();
    }

    return prisma.installation.update({
      where: { id },
      data: updateData,
    });
  }

  // ── Workers ──

  async addWorker(installationId: string, userId: string): Promise<InstallationWorker> {
    return prisma.installationWorker.create({
      data: {
        id: randomUUID(),
        installationId,
        userId,
      },
    });
  }

  async removeWorker(installationId: string, userId: string): Promise<void> {
    await prisma.installationWorker.deleteMany({
      where: { installationId, userId },
    });
  }

  async findWorkers(installationId: string): Promise<InstallationWorker[]> {
    return prisma.installationWorker.findMany({
      where: { installationId },
      include: { User: { select: { id: true, name: true, email: true } } },
    });
  }
}

export const installations = new InstallationRepository();
export default installations;
