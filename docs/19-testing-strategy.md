# 19. Стратегия тестирования

## 19.1. Принципы

1. **Shift-left** — тесты пишутся одновременно с кодом, не после. Definition of Done задачи включает прохождение её тестов.
2. **Тестирующая пирамида** — много unit-тестов, меньше integration, ещё меньше E2E. Это даёт быструю обратную связь и низкую стоимость поддержки.
3. **Тесты — это документация** — имена тестов читаются как спецификация: `should_create_deal_with_default_stage_when_no_stage_provided`.
4. **Изолированность** — тесты не зависят от внешних сервисов (LLM, email, банк) — всё мокируется. Только БД — в тестовом контейнере.
5. **Повторяемость** — каждый прогон тестов даёт тот же результат. Никаких `setTimeout`, `sleep` — только явные ожидания (polling с timeout).
6. **Быстрота** — unit-тесты < 1 секунды на suite, integration < 30 секунд, E2E < 5 минут на весь прогон.

## 19.2. Пирамида тестов

```
                    ▲
                   / \
                  / E2E\          ~20 сценариев (Playwright)
                 /-------\        < 5 минут
                /         \
               / Integration \    ~100 сценариев (Jest + testcontainers)
              /---------------\   < 30 секунд
             /                 \
            /     Unit tests     \  ~1000 тестов (Jest / pytest)
           /-----------------------\ < 5 секунд
```

Целевое покрытие:
- **Unit**: 70% строк бизнес-логики (services, lib/).
- **Integration**: 100% критичных user flows (login, create deal, generate contract, upload BOM, import 1C, pay invoice).
- **E2E**: 20 ключевых сценариев (по 2-3 на каждый модуль).

## 19.3. Уровни тестирования

### 19.3.1. Unit-тесты (TypeScript)

**Что тестируется:**
- Сервисы в `apps/web/src/lib/services/*` — бизнес-логика без обращения к БД (с моком Prisma).
- Утилиты в `apps/web/src/lib/utils.ts`, `lib/numberToWords.ts`, `lib/zakuppro.ts` — чистые функции.
- Zod-схемы валидации.
- Компоненты React (с React Testing Library) — изолированно, без HTTP.

**Инструменты:**
- Jest + ts-jest (или Vitest, если команда предпочитает).
- @testing-library/react для компонентов.
- jest-mock-extended для моков Prisma.

**Пример:**

```typescript
// apps/web/src/lib/services/__tests__/deal.service.test.ts
import { DealService } from '../deal.service';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('DealService', () => {
  let prisma: MockProxy<PrismaClient>;
  let service: DealService;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new DealService(prisma);
  });

  describe('create', () => {
    it('should_create_deal_with_default_stage_when_no_stage_provided', async () => {
      // Arrange
      const defaultStage = { id: 'stage-1', code: 'new' };
      prisma.dealStage.findFirst.mockResolvedValue(defaultStage as any);
      prisma.deal.create.mockResolvedValue({ id: 'deal-1', number: 'С-2026-00001' } as any);

      // Act
      const result = await service.create({
        title: 'Test deal',
        contactId: 'contact-1',
        pipelineId: 'pipeline-1',
        amount: 100000,
      });

      // Assert
      expect(result.id).toBe('deal-1');
      expect(prisma.deal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stageId: 'stage-1',
          number: 'С-2026-00001',
        }),
      });
    });

    it('should_throw_409_when_contact_already_has_active_deal', async () => {
      // ... тест на дубль сделки
    });
  });
});
```

### 19.3.2. Unit-тесты (Python)

**Что тестируется:**
- Celery-задачи в `apps/worker/app/tasks/*` — с моками LLM/IMAP/S3.
- Сервисы в `apps/worker/app/services/*` — бизнес-логика без БД.
- LLM-провайдер wrapper — с моками HTTP-вызовов.

**Инструменты:**
- pytest + pytest-asyncio.
- unittest.mock для моков.
- responses для HTTP-моков.

**Пример:**

```python
# apps/worker/app/tasks/test_ai_parse_bom.py
import pytest
from unittest.mock import AsyncMock, patch
from app.tasks.ai_parse_bom import parse_bom_task

@pytest.mark.asyncio
async def test_parse_bom_extracts_items_from_clean_excel(test_db, s3_mock):
    # Arrange
    file_id = 'file-1'
    project_id = 'proj-1'
    s3_mock.download.return_value = b'<excel binary>'

    with patch('app.tasks.ai_parse_bom.LLMProvider') as llm_mock:
        llm_mock.return_value.complete.return_value = [
            {'name': 'Профиль 3м', 'quantity': 10, 'article': 'P-3'},
            {'name': 'Петля', 'quantity': 20, 'article': 'PL-1'},
        ]

        # Act
        result = await parse_bom_task(file_id, project_id)

    # Assert
    assert result['itemsCount'] == 2
    assert test_db.query(BOMItem).count() == 2
```

### 19.3.3. Integration-тесты (API)

**Что тестируется:**
- API-эндпоинты с реальной БД (testcontainers PostgreSQL) и реальным Prisma-клиентом.
- RBAC-проверки — что менеджер не может удалить чужую сделку.
- Вебхуки между Next.js и Python.
- Импорт 1С-выписки на реальных XML-файлах.

**Инструменты:**
- Jest + supertest (или Next.js test mode).
- testcontainers-node для PostgreSQL в Docker.
- factory-bot или @prisma/seed для тестовых данных.

**Структура:**

```
apps/web/src/app/api/v1/contacts/__tests__/
├── contacts.list.integration.test.ts
├── contacts.create.integration.test.ts
├── contacts.merge.integration.test.ts
└── fixtures/
    └── contacts.ts
```

**Пример:**

```typescript
// apps/web/src/app/api/v1/contacts/__tests__/contacts.create.integration.test.ts
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { testDb, testAuth } from '@/test-utils';

describe('POST /api/v1/contacts', () => {
  beforeEach(async () => {
    await testDb.clean();
  });

  it('should_return_201_and_create_contact_when_valid_input', async () => {
    const user = await testDb.createUser({ roles: ['sales'] });
    const req = new NextRequest('http://localhost/api/v1/contacts', {
      method: 'POST',
      body: JSON.stringify({
        type: 'company',
        companyName: 'ООО Тест',
        inn: '7701234567',
        phone: '+74951234567',
        sourceId: 'src-1',
      }),
      headers: testAuth.headers(user),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.companyName).toBe('ООО Тест');
  });

  it('should_return_409_when_inn_already_exists', async () => {
    const user = await testDb.createUser({ roles: ['sales'] });
    await testDb.createContact({ inn: '7701234567' });

    const req = new NextRequest('http://localhost/api/v1/contacts', {
      method: 'POST',
      body: JSON.stringify({
        type: 'company', companyName: 'Дубль', inn: '7701234567',
        phone: '+74950000000', sourceId: 'src-1',
      }),
      headers: testAuth.headers(user),
    });

    const response = await POST(req);
    expect(response.status).toBe(409);
  });

  it('should_return_403_when_user_has_no_sales_role', async () => {
    const user = await testDb.createUser({ roles: ['storekeeper'] });
    const req = new NextRequest('http://localhost/api/v1/contacts', {
      method: 'POST',
      body: JSON.stringify({ type: 'person', firstName: 'Иван', phone: '+7900', sourceId: 'src-1' }),
      headers: testAuth.headers(user),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
  });
});
```

### 19.3.4. E2E-тесты (Playwright)

**Что тестируется:**
- Сквозные сценарии через реальный браузер: логин → создание сущности → проверка в UI.
- 20 ключевых user stories (см. ниже).

**Инструменты:**
- Playwright.
- Запуск против dev-окружения в Docker Compose.

**Сценарии (20 шт.):**

| # | Сценарий | Модуль |
|---|----------|--------|
| E2E-01 | Логин менеджера + создание контакта + добавление взаимодействия | CRM |
| E2E-02 | Создание сделки из контакта + перемещение по Kanban | Deals |
| E2E-03 | Создание договора из сделки + генерация PDF + скачивание | Contracts |
| E2E-04 | Загрузка скана договора + создание проекта | Contracts→Projects |
| E2E-05 | Создание проекта + загрузка BOM + ожидание AI-парсинга | Projects + Procurement |
| E2E-06 | Создание запроса поставщику + отправка email | Procurement |
| E2E-07 | Загрузка счёта вручную + сверка + одобрение | Procurement |
| E2E-08 | Создание заявки на оплату + одобрение owner'ом | Approvals |
| E2E-09 | Приход на склад + резерв под проект + списание | Warehouse |
| E2E-10 | Импорт 1С-выписки + авто-классификация + ручная правка | Finance |
| E2E-11 | Создание бюджета + проверка план/факт после транзакции | Finance |
| E2E-12 | Просмотр P&L проекта + экспорт в Excel | Finance |
| E2E-13 | Просмотр кассового календаря + идентификация разрыва | Finance |
| E2E-14 | Главная страница дашборда: все метрики видны | Analytics |
| E2E-15 | Просмотр воронки продаж | Analytics |
| E2E-16 | Получение in-app уведомления + отметка прочитанным | Notifications |
| E2E-17 | Настройка каналов уведомлений (email on, telegram off) | Notifications |
| E2E-18 | Закрытие периода + попытка редактирования транзакции (блок) | Finance |
| E2E-19 | Audit log: просмотр истории изменений сделки | Identity |
| E2E-20 | Logout + попытка доступа к API с истёкшим токеном | Identity |

**Пример:**

```typescript
// tests/e2e/deals/create-deal.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs, testDb } from '../fixtures';

test('E2E-02: create deal from contact and move through Kanban', async ({ page }) => {
  await testDb.clean();
  const contact = await testDb.createContact({ firstName: 'Иван', phone: '+7900' });
  const user = await loginAs(page, 'sales');

  await page.goto('/dashboard/crm');
  await page.click(`text=${contact.firstName}`);
  await page.click('button:has-text("Создать сделку")');

  await page.fill('input[name="title"]', 'Поставка мебели');
  await page.fill('input[name="amount"]', '500000');
  await page.click('button:has-text("Сохранить")');

  await expect(page.locator('text=С-2026-')).toBeVisible();
  await expect(page.locator('text=Поставка мебели')).toBeVisible();

  // Drag to next stage
  const dealCard = page.locator('[data-testid="deal-card"]');
  const nextStage = page.locator('[data-testid="stage-column"]:has-text("Квалификация")');
  await dealCard.dragTo(nextStage);

  await expect(page.locator('text=Квалификация')).toBeVisible();
});
```

### 19.3.5. Нагрузочное тестирование

**Что тестируется:**
- Первые 10 самых нагруженных эндпоинтов.
- Concurrent users до 100.
- RPS до 200.

**Инструменты:**
- k6 (или Artillery).

**Сценарии:**

```javascript
// tests/load/contacts-list.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // ramp-up
    { duration: '1m', target: 50 },   // stay
    { duration: '30s', target: 100 }, // peak
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% запросов < 500ms
    http_req_failed: ['rate<0.01'],    // <1% ошибок
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/v1/contacts?page=1&perPage=50', {
    headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

**Запуск:** раз в квартал + перед релизом major-версии.

### 19.3.6. AI-тесты (специальные)

AI-агент имеет высокую вариативность ответов, поэтому стандартные unit-тесты не подходят. Используем:

1. **Snapshot-тесты** на фиксированных входных данных (10 Excel-спецификаций, 10 счетов). Если результат меняется — тест падает, нужно ручное подтверждение что изменение корректно.
2. **Evaluation set** — 50 размеченных вручную примеров (вход → ожидаемый выход). Запуск раз в спринт, метрика: точность >90%.
3. **Тесты на edge-cases** — пустой Excel, нечитаемый PDF, счет с 200 позициями, спецификация на английском.

```python
# apps/worker/tests/ai/test_parse_bom_eval.py
import pytest
from pathlib import Path

EVAL_CASES = [
    ('fixtures/bom_clean.xlsx', 45, 8),       # файл, ожидаемое кол-во позиций, поставщиков
    ('fixtures/bom_dirty_merged_cells.xlsx', 32, 5),
    ('fixtures/bom_with_extra_sheets.xlsx', 78, 12),
    # ... 47 more cases
]

@pytest.mark.parametrize('file,expected_items,expected_suppliers', EVAL_CASES)
@pytest.mark.asyncio
async def test_parse_bom_eval(file, expected_items, expected_suppliers, ai_client, test_db):
    result = await parse_bom_task(file, 'proj-1')

    # Точность: 90% ожидаемого количества
    assert abs(result['itemsCount'] - expected_items) / expected_items < 0.1
    assert abs(result['suppliersDetected'] - expected_suppliers) / expected_suppliers < 0.2
```

## 19.4. Тестовые данные

### 19.4.1. Фабрики

```typescript
// apps/web/src/test-utils/factories.ts
export const factories = {
  user: (overrides: Partial<User> = {}) => ({
    id: uuid(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    passwordHash: '$2a$12$...',
    roles: ['manager'],
    isActive: true,
    ...overrides,
  }),

  contact: (overrides: Partial<Contact> = {}) => ({
    id: uuid(),
    type: 'company',
    companyName: `ООО Тест ${Date.now()}`,
    inn: `770${Math.floor(Math.random() * 1e7)}`,
    phone: '+74950000000',
    sourceId: 'src-call',
    status: 'active',
    ...overrides,
  }),

  // ... deal, contract, project, etc.
};
```

### 19.4.2. Сиды

- `prisma/seed.ts` — минимальный набор для dev: 1 owner, 1 manager, 1 contact, 1 deal, 1 project, базовые справочники.
- `prisma/seed.staging.ts` — расширенный набор для UAT: 5 пользователей разных ролей, 50 контактов, 20 сделок, 10 проектов с BOM и счетами.
- `prisma/seed.test.ts` — минимальный набор для integration-тестов: только справочники (источники, категории, роли).

### 19.4.3. Анонимизация production-данных

Если нужно загрузить реальный дамп production в staging:
1. `pg_dump` production.
2. Скрипт `scripts/anonymize-dump.ts` — заменяет ФИО, телефоны, email, ИНН на случайные.
3. `pg_restore` в staging.

## 19.5. CI/CD-интеграция

### 19.5.1. На каждый PR

```yaml
# .github/workflows/ci.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4

  python-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r apps/worker/requirements.txt
      - run: cd apps/worker && pytest

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
```

### 19.5.2. На merge в main

```yaml
  e2e-tests:
    needs: [unit-tests, integration-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f docker-compose.test.yml up -d
      - run: npx playwright install
      - run: npm run test:e2e
      - run: docker compose -f docker-compose.test.yml down
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 19.5.3. Ночью (nightly)

- Полный прогон всех тестов + AI evaluation suite.
- Нагрузочное тестирование (по понедельникам).
- Dependency scan (Dependabot).

## 19.6. Покрытие (coverage)

### 19.6.1. Цели

| Категория | Цель |
|-----------|------|
| `apps/web/src/lib/services/*` | ≥80% строк |
| `apps/web/src/lib/*` (остальное) | ≥70% |
| `apps/web/src/app/api/*` | ≥60% (integration) |
| `apps/web/src/components/*` | ≥50% |
| `apps/worker/app/tasks/*` | ≥70% |
| `apps/worker/app/services/*` | ≥80% |

### 19.6.2. Инструменты

- TypeScript: `jest --coverage` (или `vitest --coverage`).
- Python: `pytest --cov=app --cov-report=html`.
- Codecov для отслеживания тренда.

### 19.6.3. Quality gates

- На PR: coverage не должен упасть больше чем на 2%.
- На merge в main: coverage должен быть ≥70% по проекту.

## 19.7. Тестирование безопасности

### 19.7.1. SAST (Static Application Security Testing)

- ESLint plugin security (для TS).
- pip-audit / bandit (для Python).
- Запуск на каждом PR.

### 19.7.2. SCA (Software Composition Analysis)

- Dependabot (npm).
- pip-audit (Python).
- Запуск раз в неделю + на PR.

### 19.7.3. DAST (Dynamic Application Security Testing)

- OWASP ZAP — сканирование staging раз в месяц.
- Перед major-релизом — ручное pentest (опционально).

### 19.7.4. Secret scanning

- gitleaks pre-commit hook.
- GitHub Secret Scanning на push.

## 19.8. Тестирование производительности

### 19.8.1. Метрики

- Время отклика API (p50, p95, p99) — отслеживается в production через APM.
- Lighthouse Score для главной страницы — еженедельно.
- Размер бандла Next.js — на каждый PR (warning если вырос >5%).

### 19.8.2. Регрессия производительности

- На PR: если время отклика API выросло >20% — блокируем merge.
- Thresholds в k6 тестах.

## 19.9. Тестирование в продакшене

### 19.9.1. Canary-релизы

- Новый код деплоится на 10% трафика (через Docker tag + load balancer).
- Если метрики (errors, latency) не ухудшились за 30 минут — на 100%.
- Если ухудшились — автоматический rollback.

### 19.9.2. Health checks

- `/api/health` — проверка БД, RabbitMQ, S3.
- `/internal/health` — проверка у Python.
- Внешний мониторинг (UptimeRobot) — пинг раз в минуту.

### 19.9.3. Synthetic monitoring

- Раз в 5 минут — скрипт логинится, создаёт тестовый контакт, удаляет.
- Если упало — алерт.

## 19.10. Роли и ответственность

| Роль | Что делает |
|------|------------|
| Разработчик | Пишет unit + integration тесты на свой код |
| QA | Поддерживает E2E-сценарии, проводит ручное тестирование перед релизом |
| Тимлид | Code review с проверкой качества тестов |
| DevOps | Поддерживает CI/CD, testcontainers, тестовые окружения |

## 19.11. Definition of Done (DoD) для задачи

Задача считается завершённой, когда:

- [ ] Код написан и проходит lint/typecheck.
- [ ] Unit-тесты написаны, покрытие ≥70% для изменённого кода.
- [ ] Integration-тесты на новые эндпоинты.
- [ ] E2E-тест добавлен/обновлён, если затронут ключевой сценарий.
- [ ] Документация (JSDoc / docstring) обновлена.
- [ ] Code review пройден (1 approval).
- [ ] CI зелёный.
- [ ] Если есть UI-изменения — добавлен скриншот в PR.

## 19.12. Шаблоны тест-кейсов

### 19.12.1. Шаблон unit-теста

```
describe('<ModuleName>')
  describe('<functionName>')
    it('should_<expected_behavior>_when_<condition>')
    it('should_throw_<error>_when_<invalid_input>')
    it('should_handle_<edge_case>')
```

### 19.12.2. Шаблон integration-теста

```
describe('<METHOD> /api/v1/<endpoint>')
  beforeEach: очистка БД
  it('should_return_<status>_when_<valid_input>')
  it('should_return_400_when_<invalid_input>')
  it('should_return_401_when_<unauthenticated>')
  it('should_return_403_when_<unauthorized_role>')
  it('should_return_404_when_<not_found>')
  it('should_return_409_when_<conflict>')
```

### 19.12.3. Шаблон E2E-теста

```
test('E2E-<NN>: <user story>', async ({ page }) => {
  1. Pre: создать тестовые данные через API
  2. Act: открыть страницу, выполнить действия
  3. Assert: проверить UI и состояние через API
  4. Post: очистка (или через beforeEach clean)
})
```

## 19.13. Инструменты summary

| Тип | Инструмент | Где |
|-----|-----------|-----|
| Unit TS | Jest + ts-jest + @testing-library/react | apps/web |
| Unit Python | pytest + pytest-asyncio | apps/worker |
| Integration | Jest + supertest + testcontainers | apps/web |
| E2E | Playwright | tests/e2e |
| Load | k6 | tests/load |
| Coverage | Jest / pytest-cov + Codecov | оба |
| SAST | ESLint security + bandit | CI |
| SCA | Dependabot + pip-audit | CI |
| Secret scan | gitleaks | pre-commit + CI |
| DAST | OWASP ZAP | monthly on staging |

## 19.14. Связанные разделы

- [docs/15-security-rbac.md](15-security-rbac.md) — безопасность (включая тесты безопасности).
- [docs/16-non-functional.md](16-non-functional.md) — NFR (включая покрытие тестами).
- [docs/18-roadmap.md](18-roadmap.md) — задачи по тестированию в каждом спринте.
