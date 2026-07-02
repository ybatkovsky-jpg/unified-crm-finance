/**
 * DealContactService — атомарное создание контактов и привязка к сделке.
 *
 * Использует prisma.$transaction для гарантии:
 * 1. Организация + сотрудники создаются вместе (или откатываются).
 * 2. DealContact-записи создаются только после успешного создания контактов.
 *
 * Валидация:
 * - Сотрудник привязывается только к своей организации (companyId).
 * - Дубли [dealId, contactId, role] игнорируются (upsert).
 *
 * // TODO: Уточнить бизнес-логику для дубликатов ИНН — сейчас БД не имеет
 * //   unique-индекса на inn (есть обычный @@index), так что создаётся новый.
 * //   Если бизнес требует upsert по ИНН — нужен partial unique index.
 */

import { prisma } from '@/lib/db/prisma';
import { contacts } from '@/lib/db/contacts';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type {
  AddIndividualDto,
  AddCompanyWithEmployeesDto,
  PersonContactFields,
  CompanyFields,
} from '@/lib/api/deal-contacts-dto';

/** Результат запроса из БД (Prisma PascalCase Contact). */
type DealContactWithContact = Awaited<
  ReturnType<typeof prisma.dealContact.findMany<{
    include: {
      Contact: {
        select: {
          id: true;
          type: true;
          firstName: true;
          lastName: true;
          companyName: true;
          inn: true;
          phone: true;
          email: true;
          companyId: true;
        };
      };
    };
  }>>
>;

export type { DealContactWithContact };

// ── Маппинг PersonContactFields → Prisma Contact create data ──

function personToContactCreate(
  person: PersonContactFields,
  companyId?: string | null,
): Prisma.ContactUncheckedCreateInput {
  return {
    id: randomUUID(),
    type: 'person',
    firstName: person.firstName || null,
    lastName: person.lastName || null,
    middleName: person.middleName || null,
    phone: person.phone || null,
    email: person.email || null,
    position: person.position || null,
    companyId: companyId ?? null,
    status: 'active',
    updatedAt: new Date(),
    passportSeries: person.passport.passportSeries,
    passportNumber: person.passport.passportNumber,
    passportIssuedBy: person.passport.passportIssuedBy,
    passportIssuedAt: person.passport.passportIssuedAt
      ? new Date(person.passport.passportIssuedAt)
      : null,
    passportCode: person.passport.passportCode,
    registrationAddress: person.passport.registrationAddress,
  };
}

// ── Маппинг CompanyFields → Prisma Contact create data ──

function companyToContactCreate(
  company: CompanyFields,
): Prisma.ContactUncheckedCreateInput {
  return {
    id: randomUUID(),
    type: 'company',
    companyName: company.companyName,
    inn: company.inn || null,
    kpp: company.kpp || null,
    ogrn: company.ogrn || null,
    phone: company.phone || null,
    email: company.email || null,
    address: company.address || null,
    status: 'active',
    updatedAt: new Date(),
  };
}

// ── Создание DealContact (idempotent upsert) ──

function linkDealContact(
  dealId: string,
  contactId: string,
  role: string,
): Prisma.DealContactUpsertArgs {
  return {
    where: { dealId_contactId_role: { dealId, contactId, role } },
    update: {},
    create: { id: randomUUID(), dealId, contactId, role },
  };
}

// ── Сценарий 1: Добавление физлица ──

export async function addIndividualToDeal(
  dealId: string,
  dto: AddIndividualDto,
): Promise<DealContactWithContact> {
  return prisma.$transaction(async (tx) => {
    let contactId: string;

    if (dto.existingContactId) {
      // Проверяем, что контакт существует и это person
      const existing = await tx.contact.findUnique({
        where: { id: dto.existingContactId },
        select: { id: true, type: true, deletedAt: true },
      });
      if (!existing || existing.deletedAt) {
        throw new Error('Выбранный контакт не найден или удалён');
      }
      if (existing.type !== 'person') {
        throw new Error('Контакт не является физлицом');
      }
      contactId = existing.id;
    } else {
      // Создаём новое физлицо
      const created = await tx.contact.create({
        data: personToContactCreate(dto.person),
      });
      contactId = created.id;
    }

    // Привязываем к сделке
    await tx.dealContact.upsert(linkDealContact(dealId, contactId, dto.role));

    // Возвращаем результат
    return tx.dealContact.findMany({
      where: { dealId, contactId },
      include: {
        Contact: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
            inn: true,
            phone: true,
            email: true,
            companyId: true,
          },
        },
      },
    });
  });
}

// ── Сценарий 2: Организация + сотрудники ──

export async function addCompanyWithEmployeesToDeal(
  dealId: string,
  dto: AddCompanyWithEmployeesDto,
): Promise<DealContactWithContact> {
  return prisma.$transaction(async (tx) => {
    // 1. Разрешаем ID организации
    let companyId: string;

    if (dto.company.existingCompanyId) {
      // Проверяем существующую компанию
      const existing = await tx.contact.findUnique({
        where: { id: dto.company.existingCompanyId },
        select: { id: true, type: true, deletedAt: true },
      });
      if (!existing || existing.deletedAt) {
        throw new Error('Выбранная организация не найдена или удалена');
      }
      if (existing.type !== 'company') {
        throw new Error('Контакт не является организацией');
      }
      companyId = existing.id;
    } else {
      // Создаём новую организацию
      if (!dto.company.companyName.trim()) {
        throw new Error('Название организации обязательно');
      }
      const created = await tx.contact.create({
        data: companyToContactCreate(dto.company),
      });
      companyId = created.id;
    }

    // 2. Привязываем организацию к сделке
    await tx.dealContact.upsert(
      linkDealContact(dealId, companyId, dto.companyRole),
    );

    // 3. Создаём/привязываем сотрудников
    const allContactIds: string[] = [companyId];

    for (const emp of dto.employees) {
      let empContactId: string;

      if (emp.existingContactId) {
        // Проверяем, что сотрудник существует и принадлежит этой компании
        const existing = await tx.contact.findUnique({
          where: { id: emp.existingContactId },
          select: { id: true, type: true, companyId: true, deletedAt: true },
        });
        if (!existing || existing.deletedAt) {
          throw new Error(`Сотрудник не найден или удалён`);
        }
        if (existing.type !== 'person') {
          throw new Error(`Контакт ${emp.existingContactId} не является физлицом`);
        }
        // ВАЛИДАЦИЯ: companyId сотрудника должен совпадать
        // (null допускаем — сотрудник может быть без организации, привязываем)
        if (existing.companyId && existing.companyId !== companyId) {
          throw new Error(
            `Сотрудник привязан к другой организации (companyId=${existing.companyId})`,
          );
        }
        empContactId = existing.id;
      } else {
        // Создаём нового сотрудника с привязкой к компании
        const created = await tx.contact.create({
          data: personToContactCreate(emp.person, companyId),
        });
        empContactId = created.id;
      }

      // Привязываем сотрудника к сделке с его ролью
      await tx.dealContact.upsert(
        linkDealContact(dealId, empContactId, emp.role),
      );
      allContactIds.push(empContactId);
    }

    // 4. Возвращаем все созданные/обновлённые связи
    return tx.dealContact.findMany({
      where: {
        dealId,
        contactId: { in: allContactIds },
      },
      include: {
        Contact: {
          select: {
            id: true,
            type: true,
            firstName: true,
            lastName: true,
            companyName: true,
            inn: true,
            phone: true,
            email: true,
            companyId: true,
          },
        },
      },
    });
  });
}

// ── Отвязка контакта от сделки (не удаляет Contact из БД) ──

export async function unlinkContactFromDeal(
  dealId: string,
  contactId: string,
  role?: string,
): Promise<{ count: number }> {
  const result = await prisma.dealContact.deleteMany({
    where: {
      dealId,
      contactId,
      ...(role ? { role } : {}),
    },
  });
  return { count: result.count };
}
