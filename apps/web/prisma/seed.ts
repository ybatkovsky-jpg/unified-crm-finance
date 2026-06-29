/**
 * Seed script для начального наполнения БД.
 * Запуск: npm run db:seed (или: cd apps/web && tsx prisma/seed.ts)
 *
 * Создаёт:
 * - 5 ролей (owner, sales, manager, accountant, storekeeper)
 * - 1 пользователя-owner (для первого входа)
 * - Справочник источников лидов
 * - 1 воронку со стадиями (для модуля Сделки)
 * - Корневые категории (для модуля Финансы)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const now = () => new Date();
const mkId = () => randomUUID();

async function main() {
  console.log('🌱 Seeding...');

  // === Роли ===
  const roles = [
    {
      code: 'director',
      name: 'Директор',
      description: 'Полный доступ ко всему',
      permissions: { sections: ['crm', 'projects', 'procurement', 'finance', 'accounting', 'analytics', 'settings'], viewAllProjects: true },
    },
    {
      code: 'manager_designer',
      name: 'Менеджер-дизайнер',
      description: 'Сделки, КП, договоры; ведёт проект от и до',
      permissions: { sections: ['crm', 'projects', 'procurement', 'finance', 'analytics'], viewAllProjects: false },
    },
    {
      code: 'technologist',
      name: 'Технолог',
      description: 'Замер #2, ТЗ/спецификация, контроль производства',
      permissions: { sections: ['projects', 'procurement', 'analytics'], viewAllProjects: true },
    },
    {
      code: 'supply',
      name: 'Снабженец',
      description: 'Закупки, поставщики, склад',
      permissions: { sections: ['projects', 'procurement', 'finance', 'analytics'], viewAllProjects: true },
    },
    {
      code: 'installer',
      name: 'Монтажник',
      description: 'Монтаж, сдача акта физлицам',
      permissions: { sections: ['projects', 'analytics'], viewAllProjects: false },
    },
    {
      code: 'accountant',
      name: 'Бухгалтер',
      description: 'Финансы, оплаты, отчёты',
      permissions: { sections: ['finance', 'accounting', 'analytics', 'procurement'], viewAllProjects: true },
    },
    {
      code: 'storekeeper',
      name: 'Кладовщик',
      description: 'Склад, приёмка, списание',
      permissions: { sections: ['procurement'], viewAllProjects: false },
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: { ...role, id: mkId(), updatedAt: now() },
    });
    console.log(`  ✓ Role: ${role.code}`);
  }

  // === Owner пользователь ===
  const passwordHash = await bcrypt.hash('admin123', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'admin@local' },
    update: {},
    create: {
      id: mkId(),
      email: 'admin@local',
      name: 'Администратор',
      passwordHash,
      isActive: true,
      updatedAt: now(),
    },
  });
  const ownerRole = await prisma.role.findUnique({ where: { code: 'director' } });
  if (ownerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
      update: {},
      // UserRole has composite @@id([userId, roleId]) — no `id`/`updatedAt` fields
      create: { userId: owner.id, roleId: ownerRole.id },
    });
  }
  console.log('  ✓ Owner user: admin@local / admin123');

  // === Источники лидов (канонический список ТЗ — 10 источников) ===
  const newSources = [
    { code: '2gis', name: '2ГИС', description: 'Поиск в 2ГИС' },
    { code: 'website', name: 'Сайт', description: 'Заявка с сайта' },
    { code: 'internet', name: 'Интернет', description: 'Поиск в интернете' },
    { code: 'instagram', name: 'Instagram', description: 'Соцсеть Instagram' },
    { code: 'vk', name: 'ВКонтакте', description: 'Соцсеть ВКонтакте' },
    { code: 'telegram_group', name: 'Telegram-группа', description: 'Обращение из Telegram-группы' },
    { code: 'office', name: 'Заход в офис', description: 'Личный визит в офис' },
    { code: 'referral', name: 'Сарафан (рекомендация)', description: 'Пришёл по рекомендации' },
    { code: 'old_base', name: 'Звонок по старой базе', description: 'Обзвон старой клиентской базы' },
    { code: 'designer', name: 'Дизайнер (внешний партнёр)', description: 'Клиент от дизайнера-партнёра' },
  ];
  // Деактивируем старые источники, которых нет в каноническом списке
  const oldCodes = ['call', 'email', 'telegram', 'other'];
  for (const oldCode of oldCodes) {
    await prisma.leadSource.upsert({
      where: { code: oldCode },
      update: { isActive: false },
      create: { id: mkId(), code: oldCode, name: oldCode, description: 'Устаревший источник', isActive: false },
    });
  }
  for (const s of newSources) {
    await prisma.leadSource.upsert({
      where: { code: s.code },
      update: { ...s, isActive: true },
      create: { ...s, id: mkId(), isActive: true },
    });
  }
  console.log(`  ✓ Lead sources: ${newSources.length} active (+ ${oldCodes.length} deprecated)`);

  // === Воронка по умолчанию ===
  const pipeline = await prisma.pipeline.upsert({
    where: { code: 'default' },
    update: {},
    create: {
      id: mkId(),
      code: 'default',
      name: 'Воронка по умолчанию',
      description: 'Стандартная воронка B2B-продаж',
      isActive: true,
      // Pipeline has no updatedAt field
    },
  });

  const stages = [
    { code: 'new', name: 'Новый лид', order: 1, probability: 0.1, color: '#94a3b8' },
    { code: 'qualified', name: 'Квалификация', order: 2, probability: 0.25, color: '#3b82f6' },
    { code: 'meeting', name: 'Встреча', order: 3, probability: 0.4, color: '#8b5cf6' },
    { code: 'proposal', name: 'КП', order: 4, probability: 0.55, color: '#ec4899' },
    { code: 'negotiation', name: 'Переговоры', order: 5, probability: 0.7, color: '#f59e0b' },
    { code: 'contract', name: 'Договор', order: 6, probability: 0.9, color: '#10b981' },
    { code: 'won', name: 'Выиграно', order: 7, probability: 1.0, isWonStage: true, color: '#059669' },
    { code: 'lost', name: 'Потеряно', order: 8, probability: 0, isLostStage: true, color: '#ef4444' },
  ];
  for (const s of stages) {
    await prisma.dealStage.upsert({
      where: { pipelineId_code: { pipelineId: pipeline.id, code: s.code } },
      update: s,
      // DealStage has no updatedAt field
      create: { ...s, id: mkId(), pipelineId: pipeline.id },
    });
  }
  console.log(`  ✓ Default pipeline with ${stages.length} stages`);

  // === Категории финансов ===
  const categories = [
    { name: 'Выручка', type: 'income', order: 1 },
    { name: 'Материалы', type: 'expense', order: 1 },
    { name: 'Подрядчики', type: 'expense', order: 2 },
    { name: 'Зарплаты', type: 'expense', order: 3 },
    { name: 'Аренда', type: 'expense', order: 4 },
    { name: 'Налоги', type: 'expense', order: 5 },
    { name: 'Транспорт', type: 'expense', order: 6 },
    { name: 'Прочее', type: 'expense', order: 99 },
  ];
  for (const c of categories) {
    await prisma.category.create({ data: { ...c, id: mkId(), updatedAt: now() } }).catch(() => {
      // ignore duplicates
    });
  }
  console.log(`  ✓ Categories: ${categories.length}`);

  // === Производства-партнёры (тестовые данные) ===
  const productionPartners = [
    {
      name: 'ИП Петров С.В. (плитные)',
      type: 'supplier',
      types: JSON.stringify(['plate', 'paint', 'universal']),
      contactPerson: 'Сергей Петров',
      phone: '+7-999-111-22-33',
      email: 'petrov@example.com',
      notes: 'ДСП/МДФ, покраска, плёночные фасады. Срок 2-3 недели.',
      rating: 4,
    },
    {
      name: 'ООО «КаменьПро»',
      type: 'supplier',
      types: JSON.stringify(['stone', 'concrete']),
      contactPerson: 'Алексей Иванов',
      phone: '+7-999-444-55-66',
      email: 'kamenpro@example.com',
      notes: 'Столешницы из акрила/кварца, бетонные изделия. Срок 3-4 недели.',
      rating: 5,
    },
    {
      name: 'ООО «СтеклоДом»',
      type: 'supplier',
      types: JSON.stringify(['glass', 'universal']),
      contactPerson: 'Марина Стеклова',
      phone: '+7-999-777-88-99',
      email: 'steklodom@example.com',
      notes: 'Стеклянные фасады, зеркала, витражи. Срок 1-2 недели.',
      rating: 4,
    },
  ];

  for (const p of productionPartners) {
    const existing = await prisma.counterparty.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.counterparty.create({
        data: { id: mkId(), ...p, updatedAt: now() },
      });
      console.log(`  ✓ Partner: ${p.name}`);
    } else {
      console.log(`  ✓ Partner (exists): ${p.name}`);
    }
  }

  console.log('✅ Seeding complete');
  console.log('');
  console.log('Login: admin@local / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
