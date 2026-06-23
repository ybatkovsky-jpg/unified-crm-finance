# M005: Закупки

**Gathered:** 2026-06-23
**Status:** Ready for planning

## Project Description

Модуль Закупки — самый функционально насыщенный модуль, переносимый из zakuppro. Покрывает полный цикл: спецификация (BOM) → запрос поставщику → счёт → сверка → оплата → поставка → склад. Включает AI-агента для парсинга Excel и сверки счетов, email-воркер для отправки запросов и приёма счетов, склад с резервированием.

В unified-системе модуль интегрируется с CRM (через проект и контрагента), с договорами (сумма договора = бюджет проекта), с финансами (счета → транзакции, остатки на складе → оценка активов).

## Why This Milestone

Это ключевой модуль системы — ради него и создавался unified-crm-finance. Закупки — основной бизнес-процесс компании: от спецификации проекта до поставки материалов на склад. Модуль заменяет zakuppro и интегрируется с уже построенными модулями CRM, Deals, Contracts, Projects.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Вести справочник поставщиков (контрагентов) с банковскими реквизитами, историей запросов/счетов/поставок
- Загружать Excel-спецификацию в проект, AI распознаёт позиции, менеджер редактирует и назначает поставщиков
- Группировать позиции BOM по поставщикам и отправлять email-запросы через систему
- Получать счета от поставщиков (автоматически через email или вручную), AI сверяет позиции с заказом
- Создавать заявки на согласование оплаты, owner одобряет/отклоняет
- Вести складской учёт: приход, расход, резервирование, минимальные остатки
- Отслеживать поставки: статусы, трекинг-номера, автоматическое обновление склада при получении

### Entry point / environment

- Entry point: `/dashboard/projects/[id]` (BOM tab), `/dashboard/procurement/counterparties`, `/dashboard/procurement/purchase-requests`, `/dashboard/procurement/invoices`, `/dashboard/procurement/warehouse`, `/dashboard/procurement/approvals`
- Environment: local dev / browser
- Live dependencies involved: SQLite/PostgreSQL (database), MinIO (file storage for Excel/PDF), Python worker (AI parsing, email)

## Completion Class

- Contract complete means: All API endpoints work per docs/10-module-procurement.md, Repository tests pass, UI components render
- Integration complete means: Counterparty ↔ BOM (supplier assignment), BOM ↔ PurchaseRequest (grouping), Invoice ↔ PurchaseRequest (matching), Invoice ↔ ApprovalRequest (payment approval), Delivery ↔ Warehouse (auto-update), Project ↔ Procurement (BOM, requests, invoices)
- Operational complete means: Excel upload + AI parse flow, email send/receive, invoice matching with diff view, warehouse transaction tracking

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Пользователь может загрузить Excel-спецификацию в проект и увидеть распознанные AI позиции BOM
- Пользователь может сгруппировать позиции по поставщикам и отправить email-запросы
- Система получает счёт от поставщика, AI сверяет позиции, менеджер подтверждает
- Owner одобряет заявку на оплату счёта
- Складские операции (приход/расход/резерв) корректно обновляют остатки
- Поставка отмечается как delivered, склад автоматически обновляется

## Architectural Decisions

### Repository Pattern для всех procurement сущностей

**Decision:** Каждая procurement-сущность получает Repository класс (CounterpartyRepository, BOMRepository, PurchaseRequestRepository, InvoiceRepository, WarehouseRepository, DeliveryRepository, ApprovalRepository) следующий установленному паттерну из M002/M003/M004.

**Rationale:** Консистентность с существующей кодовой базой. Все предыдущие модули используют этот паттерн.

### AI-агент через Python worker webhook

**Decision:** AI-операции (парсинг Excel, сверка счетов) выполняются асинхронно через Python FastAPI воркер. Next.js отправляет webhook, воркер обрабатывает и возвращает результат через callback.

**Rationale:** AI-операции требуют Python-экосистемы (pandas, pdfplumber, rapidfuzz). Существующая гибридная архитектура (ADR-01) уже предусматривает этот паттерн.

### Email через Python воркер (aiosmtplib + IMAP)

**Decision:** Отправка и получение email выполняется Python-воркером. Отправка через aiosmtplib, получение через IMAP polling каждые 15 минут.

**Rationale:** Python имеет зрелые библиотеки для работы с email. Next.js не должен блокироваться на IMAP-ожидании.

### Fuzzy matching счетов через rapidfuzz + embeddings

**Decision:** Сверка позиций счёта с позициями заказа использует rapidfuzz (Levenshtein distance) для fuzzy-matching названий с порогами: >90% = match, 70-90% = mismatch flag, <70% = new item.

**Rationale:** Названия позиций в счетах редко совпадают точно с названиями в спецификации. Fuzzy matching — стандартный подход.

## Error Handling Strategy

- Excel parse failures — сохраняем исходный файл, показываем ошибку с номером строки, позволяем повторный парсинг
- Email send failures — retry 3 раза с экспоненциальной задержкой, логируем в EmailLog
- Invoice matching discrepancies — показываем diff с подсветкой, позволяем ручную сверку
- Warehouse negative stock — блокируем операцию, показываем текущий остаток
- Approval chain breaks — уведомление администратору, ручное продвижение

## Risks and Unknowns

- **AI parsing quality** — качество распознавания Excel зависит от структуры файла. Грязные спецификации потребуют LLM.
- **Email deliverability** — нужен SMTP-сервер для отправки. В dev используем Mailpit или логи.
- **Invoice attachment parsing** — PDF от разных поставщиков имеют разную структуру.
- **Масштаб модуля** — 7 функциональных областей, ~25 API endpoints. Самый большой модуль в системе.

## Existing Codebase / Prior Art

- `apps/web/prisma/schema.prisma` — все procurement модели уже существуют
- `apps/web/features/deals/` — DealRepository pattern (reference)
- `apps/web/features/projects/` — ProjectRepository, list/detail pages
- `apps/worker/` — FastAPI worker с health endpoint
- `docs/10-module-procurement.md` — полная спецификация (49 требований)

## Relevant Requirements

- **R014** — Модуль закупки: заявки, позиции, утверждения, поставщики (primary owning slice: M005)

## Scope

### In Scope

- Counterparty CRUD (поставщики с банковскими реквизитами, историей)
- BOM management (Excel upload + AI parse + manual CRUD + lock)
- Purchase Request management (group by supplier, email sending, status tracking)
- Invoice management (receive/upload, AI matching, manual verification, diff view)
- Approval workflow (payment approval requests, approve/reject)
- Warehouse (inventory CRUD, transactions: in/out/reserve/release, low stock alerts)
- Delivery tracking (status pipeline, auto-update warehouse on delivery)

### Out of Scope / Non-Goals

- Полноценный AI multi-provider fallback — Python worker skeleton only
- Email-воркер с IMAP polling — Python worker skeleton, email через mock/log
- Импорт поставщиков из Excel — deferred до production data migration
- Автоматические напоминания поставщикам — M008 (Уведомления)
- Складская аналитика (оборачиваемость) — M007 (Аналитика)
- Цепочки согласования (multiple approvers) — owner-only для MVP
- Telegram-бот интеграция — separate milestone

## Technical Constraints

- Prisma 6.6.0 (locked из-за breaking changes в 7.x)
- SQLite для dev, PostgreSQL для production
- Next.js 16, React 19, shadcn/ui для UI
- Python 3.12+ для worker
- MinIO для file storage

## Integration Points

- **Project** — BOM привязан к проекту, PurchaseRequest/Invoice/Delivery ссылаются на проект
- **Counterparty** — поставщики для BOM items, PurchaseRequest, Invoice, Delivery
- **Contact** — контрагенты могут быть связаны с контактами CRM
- **FileEntity** — storage для Excel спецификаций, PDF/Excel счетов
- **EmailLog** — журнал всей email-переписки
- **User/Role** — RBAC: owner, manager, accountant, storekeeper
- **Transaction (Finance)** — счета создают транзакции после оплаты (M006)

## Testing Requirements

- Unit tests для всех Repository классов
- API integration tests для всех endpoints
- Manual verification для Excel upload + AI parse flow, email send

## Open Questions

- Нужен ли feedback loop для AI-парсинга (пользователь корректирует → модель учится)?
- Нужна ли интеграция с 1С:Бухгалтерия для синхронизации счетов и платежей?
