/**
 * DealContactRepository — связи сделки с контактными лицами по ролям.
 *
 * Роли: customer (заказчик), designer (дизайнер), installer (монтажник), other.
 */
import { prisma } from './prisma';
import { randomUUID } from 'node:crypto';

export type DealContactRole = 'customer' | 'designer' | 'installer' | 'other';

export const DEAL_CONTACT_ROLES: DealContactRole[] = ['customer', 'designer', 'installer', 'other'];

export function isDealContactRole(v: string): v is DealContactRole {
  return (DEAL_CONTACT_ROLES as string[]).includes(v);
}

export function dealContactRoleLabel(role: string): string {
  const map: Record<string, string> = {
    customer: 'Заказчик',
    designer: 'Дизайнер',
    installer: 'Монтажник',
    other: 'Другое',
  };
  return map[role] ?? role;
}

export class DealContactRepository {
  /** Список контактов сделки с раскрытыми данными контакта. */
  async listByDeal(dealId: string) {
    return prisma.dealContact.findMany({
      where: { dealId },
      include: {
        Contact: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            middleName: true,
            companyName: true,
            inn: true,
            kpp: true,
            phone: true,
            email: true,
            position: true,
            companyId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Добавить контакт к сделке (idempotent по [dealId, contactId, role]). */
  async add(dealId: string, contactId: string, role: string) {
    return prisma.dealContact.upsert({
      where: { dealId_contactId_role: { dealId, contactId, role } },
      update: {},
      create: { id: randomUUID(), dealId, contactId, role },
    });
  }

  /** Убрать конкретную связь контакт+роль. */
  async remove(dealId: string, contactId: string, role: string) {
    return prisma.dealContact.deleteMany({
      where: { dealId, contactId, role },
    });
  }

  /** Убрать все связи контакта со сделкой (любые роли). */
  async removeAllForContact(dealId: string, contactId: string) {
    return prisma.dealContact.deleteMany({
      where: { dealId, contactId },
    });
  }
}

export const dealContacts = new DealContactRepository();
export default dealContacts;
