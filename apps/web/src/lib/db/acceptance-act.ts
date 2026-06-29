/**
 * AcceptanceActRepository — акт приёмки выполненных работ (PROJ-12).
 *
 * Тип подписанта определяется по типу контрагента проекта (Contact.type):
 *  - person  (физлицо) → "individual": подписывает монтажник на объекте.
 *  - company (юрлицо)  → "legal":       подписывает менеджер (ЭДО/бумага).
 *
 * Статус-машина: draft → signed.
 */

import { prisma } from './prisma';
import type { AcceptanceAct, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ValidationError, NotFoundError } from './errors';

export type AcceptanceActStatus = 'draft' | 'signed';
export type AcceptanceSignerType = 'individual' | 'legal';
export type AcceptanceSignMethod = 'paper' | 'edo';

const VALID_STATUSES: AcceptanceActStatus[] = ['draft', 'signed'];
const VALID_SIGNER_TYPES: AcceptanceSignerType[] = ['individual', 'legal'];
const VALID_SIGN_METHODS: AcceptanceSignMethod[] = ['paper', 'edo'];

export type AcceptanceActCreateInput = {
  signerType?: AcceptanceSignerType;
  signMethod?: AcceptanceSignMethod;
  actFileId?: string;
  notes?: string;
};

export type AcceptanceActUpdateInput = {
  signMethod?: AcceptanceSignMethod | null;
  actFileId?: string | null;
  notes?: string | null;
  status?: AcceptanceActStatus;
};

export type SignActInput = {
  signedById: string;
  signerType?: AcceptanceSignerType;
  signMethod?: AcceptanceSignMethod;
};

/** Вывести тип подписанта из типа контрагента: person→individual, company→legal. */
export function signerTypeFromContactType(contactType: string | null | undefined): AcceptanceSignerType {
  return contactType === 'company' ? 'legal' : 'individual';
}

export class AcceptanceActRepository {
  /**
   * Найти акт проекта (1:1). Возвращает null, если акта нет.
   */
  async findByProject(projectId: string): Promise<AcceptanceAct | null> {
    return prisma.acceptanceAct.findUnique({
      where: { projectId },
      include: {
        SignedBy: { select: { id: true, name: true, email: true } },
        ActFile: true,
      },
    });
  }

  async findById(id: string): Promise<AcceptanceAct | null> {
    return prisma.acceptanceAct.findUnique({
      where: { id },
      include: {
        SignedBy: { select: { id: true, name: true, email: true } },
        ActFile: true,
      },
    });
  }

  /**
   * Создать акт для проекта. Если акт уже существует — возвращаем существующий (идемпотентно).
   * signerType по умолчанию выводится из Contact.type проекта.
   */
  async create(projectId: string, data: AcceptanceActCreateInput): Promise<AcceptanceAct> {
    if (data.signerType && !VALID_SIGNER_TYPES.includes(data.signerType)) {
      throw new ValidationError(`Invalid signerType: ${data.signerType}`);
    }
    if (data.signMethod && !VALID_SIGN_METHODS.includes(data.signMethod)) {
      throw new ValidationError(`Invalid signMethod: ${data.signMethod}`);
    }

    // Идемпотентность: если акт уже есть — возвращаем его.
    const existing = await prisma.acceptanceAct.findUnique({ where: { projectId } });
    if (existing) return existing;

    // Вывести тип подписанта из контрагента, если не задан явно.
    let signerType = data.signerType;
    if (!signerType) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { Contact: { select: { type: true } } },
      });
      signerType = signerTypeFromContactType(project?.Contact?.type);
    }

    return prisma.acceptanceAct.create({
      data: {
        id: randomUUID(),
        projectId,
        number: 1,
        status: 'draft',
        signerType,
        signMethod: data.signMethod ?? null,
        actFileId: data.actFileId ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, data: AcceptanceActUpdateInput): Promise<AcceptanceAct> {
    const act = await prisma.acceptanceAct.findUnique({ where: { id } });
    if (!act) throw new NotFoundError('Acceptance act not found');

    if (data.signMethod !== undefined && data.signMethod && !VALID_SIGN_METHODS.includes(data.signMethod)) {
      throw new ValidationError(`Invalid signMethod: ${data.signMethod}`);
    }
    if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
      throw new ValidationError(`Invalid status: ${data.status}`);
    }

    const updateData: Prisma.AcceptanceActUpdateInput = { updatedAt: new Date() };
    if (data.signMethod !== undefined) updateData.signMethod = data.signMethod;
    if (data.actFileId !== undefined) {
      updateData.ActFile = data.actFileId ? { connect: { id: data.actFileId } } : { disconnect: true };
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    return prisma.acceptanceAct.update({ where: { id }, data: updateData });
  }

  /**
   * Подписать акт: переход draft → signed, проставляет signedAt и подписанта.
   * signerType, если не передан, выводится из Contact.type проекта.
   */
  async sign(id: string, input: SignActInput): Promise<AcceptanceAct> {
    const act = await prisma.acceptanceAct.findUnique({ where: { id } });
    if (!act) throw new NotFoundError('Acceptance act not found');

    if (act.status === 'signed') {
      throw new ValidationError('Act is already signed');
    }

    let signerType = input.signerType;
    if (!signerType) {
      const project = await prisma.project.findUnique({
        where: { id: act.projectId },
        select: { Contact: { select: { type: true } } },
      });
      signerType = signerTypeFromContactType(project?.Contact?.type);
    }
    if (!VALID_SIGNER_TYPES.includes(signerType)) {
      throw new ValidationError(`Invalid signerType: ${signerType}`);
    }
    if (input.signMethod && !VALID_SIGN_METHODS.includes(input.signMethod)) {
      throw new ValidationError(`Invalid signMethod: ${input.signMethod}`);
    }

    const now = new Date();
    return prisma.acceptanceAct.update({
      where: { id },
      data: {
        status: 'signed',
        signedById: input.signedById,
        signedAt: now,
        signerType,
        signMethod: input.signMethod ?? act.signMethod,
        updatedAt: now,
      },
    });
  }

  async delete(id: string): Promise<AcceptanceAct> {
    return prisma.acceptanceAct.delete({ where: { id } });
  }
}

export const acceptanceActs = new AcceptanceActRepository();
export default acceptanceActs;
