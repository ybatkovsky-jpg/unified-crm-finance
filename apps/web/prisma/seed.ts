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

  // === 12 статей постоянных расходов организации (ACCT-01, PRODUCT-SPEC п.6) ===
  // Справочник орг-учёта — отдельно от проектных категорий выше (это расходы
  // организации, не привязанные к проекту). findFirst-guard вместо create().catch(),
  // т.к. у Category нет уникального бизнес-ключа.
  const orgExpenseArticles: Array<{ name: string; order: number; note?: string }> = [
    { name: 'Аренда офиса', order: 10, note: '~44 500 ₽/мес' },
    { name: 'Ведение бухгалтерии', order: 11, note: '~20 000 ₽/мес' },
    { name: 'Зарплата — Ольга', order: 12, note: '150 000 ₽/мес' },
    { name: 'Зарплата — Марианна', order: 13, note: '150 000 ₽/мес' },
    { name: 'Зарплата — Юра', order: 14, note: '80 000 ₽/мес' },
    { name: 'Рекламный бюджет', order: 15, note: '~50 000 ₽/мес (если только 2ГИС)' },
    { name: 'Офисные затраты', order: 16, note: 'бумага, кофе ~5 000 ₽/мес' },
    { name: 'Прочие расходы', order: 17, note: 'амортизация, мелочовка ~5 000 ₽/мес' },
    { name: 'Налоги (УСН 15%)', order: 18, note: 'расчётно: 15% (доходы−расходы), мин. 1% от дохода' },
    { name: 'Электроэнергия, вода', order: 19, note: '~5 000 ₽/мес' },
    { name: 'Интернет', order: 20, note: '~1 000 ₽/мес' },
    { name: 'Телефон Мегафон', order: 21, note: '~350 ₽/мес (89992563879)' },
  ];
  const orgArticleCategories: Array<{ id: string; name: string }> = [];
  for (const a of orgExpenseArticles) {
    const existing = await prisma.category.findFirst({
      where: { name: a.name, type: 'expense' },
      select: { id: true },
    });
    const id = existing?.id ?? mkId();
    if (!existing) {
      await prisma.category.create({
        data: { id, name: a.name, type: 'expense', order: a.order, updatedAt: now() },
      });
    }
    orgArticleCategories.push({ id, name: a.name });
  }
  console.log(`  ✓ Org expense articles (ACCT-01): ${orgArticleCategories.length}`);

  // === Демо-план постоянных расходов на текущий месяц (ACCT-03) ===
  // Номинальные плановые суммы из интервью — загружаются как отправная точка плана;
  // бухгалтер правит через UI. period = "YYYY-MM" текущего месяца.
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const orgPlanAmounts: Record<string, number> = {
    'Аренда офиса': 44500,
    'Ведение бухгалтерии': 20000,
    'Зарплата — Ольга': 150000,
    'Зарплата — Марианна': 150000,
    'Зарплата — Юра': 80000,
    'Рекламный бюджет': 50000,
    'Офисные затраты': 5000,
    'Прочие расходы': 5000,
    'Налоги (УСН 15%)': 0, // расчётно
    'Электроэнергия, вода': 5000,
    'Интернет': 1000,
    'Телефон Мегафон': 350,
  };
  let planSeeded = 0;
  for (const art of orgArticleCategories) {
    const amount = orgPlanAmounts[art.name] ?? 0;
    // org-бюджет: projectId = null. Идемпотентность по (categoryId+period) для NULL-строк.
    const existing = await prisma.budget.findFirst({
      where: { categoryId: art.id, period: currentMonth, projectId: null },
      select: { id: true },
    });
    if (!existing) {
      await prisma.budget.create({
        data: {
          id: mkId(),
          projectId: null,
          categoryId: art.id,
          amount,
          period: currentMonth,
          note: 'План (демо из интервью)',
          updatedAt: now(),
        },
      });
      planSeeded++;
    }
  }
  console.log(`  ✓ Org plan for ${currentMonth} (ACCT-03): ${planSeeded} new articles`);

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

  // === Орг-структура: отделы → функции (PLAT-06, PRODUCT-SPEC) ===
  // Дефолтная иерархия: пользователь назначает людей через UI. Идемпотентно по имени.
  const orgStructure: Array<{ dept: string; functions: string[] }> = [
    {
      dept: 'Продажи',
      functions: ['Лиды и квалификация', 'Презентации/КП', 'Договоры'],
    },
    {
      dept: 'Производство',
      functions: ['Замеры', 'Спецификация/ТЗ', 'Контроль производства', 'Монтаж'],
    },
    {
      dept: 'Закупки и склад',
      functions: ['Закупки материалов', 'Работа с поставщиками', 'Складской учёт', 'Инвентаризация'],
    },
    {
      dept: 'Финансы и бухгалтерия',
      functions: ['Оплата налогов', 'Выплата зарплат', 'Оплата аренды', 'Банк-клиент', 'Отчётность'],
    },
    {
      dept: 'Маркетинг и реклама',
      functions: ['Реклама (2ГИС)', 'SMM/соцсети', 'Контент для сайта'],
    },
  ];
  let orgDeptsSeeded = 0;
  let orgFnsSeeded = 0;
  for (const item of orgStructure) {
    // Отдел — upsert по имени (name @unique).
    const dept = await prisma.department.upsert({
      where: { name: item.dept },
      update: { updatedAt: now() },
      create: { id: mkId(), name: item.dept, updatedAt: now() },
    });
    orgDeptsSeeded++;
    for (const fnName of item.functions) {
      // Функция — unique [departmentId, name]. findFirst-guard (upsert по композитному ключу).
      const existingFn = await prisma.orgFunction.findFirst({
        where: { departmentId: dept.id, name: fnName },
        select: { id: true },
      });
      if (!existingFn) {
        await prisma.orgFunction.create({
          data: { id: mkId(), departmentId: dept.id, name: fnName, updatedAt: now() },
        });
        orgFnsSeeded++;
      }
    }
  }
  console.log(`  ✓ Org structure (PLAT-06): ${orgDeptsSeeded} departments, ${orgFnsSeeded} new functions`);

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
