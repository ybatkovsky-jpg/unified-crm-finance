# Phase 1: Доступ и авторизация (RBAC) - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — решения приняты по разумным дефолтам, заказчик делегировал технический выбор. Поправить можно на review.

<domain>
## Phase Boundary

Хребет доступа: экран входа `/login` (email+пароль), сессия (JWT в httpOnly-cookie), middleware-изоляция (без входа — закрыто, + RBAC по роли), админка пользователей/ролей для директора. Привязка к существующим моделям User/Role/UserRole. 7 ролей по матрице видимости PRODUCT-SPEC п.1.

</domain>

<decisions>
## Implementation Decisions

### Механизм авторизации
- Credentials email+пароль → JWT (подпись через `jose`, Edge-compatible для middleware) в **httpOnly, Secure, SameSite=Lax** cookie.
- Пароли — **bcrypt** (уже используется в seed, cost 12).
- Без OAuth/SSO в v1 (внутренний инструмент, малая команда).

### Сессия
- JWT long-lived (**7 дней**, внутренний инструмент — «remain logged in»), обновляется при активности.
- `lastLoginAt` обновляется при входе.
- «Выйти» — очищает cookie (blacklist не нужен, короткий TTL).

### Логин-флоу
- `/login` (страница) → `POST /api/auth/login` (verify bcrypt → set cookie) → редирект на `/` (CRM-канбан).
- `POST /api/auth/logout` — очищает сессию.
- `GET /api/auth/me` — текущий пользователь (для UI/шапки).

### Middleware / RBAC
- middleware.ts: читает JWT из cookie, верифицирует (jose). Защита ВСЕХ маршрутов кроме `/login`, `/api/auth/login`, `/api/health`, статики.
- Роль → разрешённые разделы (по матрице видимости). Несовпадение → редирект на `/login` или 403.
- Видимость проектов: менеджер-дизайнер — только свои (через ProjectMember/ownerId); директор/бухгалтер/технолог/снабженец — все; монтажник — свои задачи/проекты; кладовщик — только склад.

### Роли (привести к спеке)
- Текущие засеянные роли (owner/sales/manager/accountant/storekeeper) НЕ совпадают со спекой.
- **7 ролей по спеке:** director (директор), manager_designer (менеджер-дизайнер), technologist (технолог), supply (снабженец), installer (монтажник), accountant (бухгалтер), storekeeper (кладовщик).
- `Role.permissions` (Json) хранит матрицу: список доступных разделов + флаги (view_all_projects и т.п.).
- При миграции: смаппить существующего admin@local → director.

### Админка пользователей (директор)
- `/settings/users`: список, создание (email, ФИО, роль, временный пароль), блокировка (isActive), сброс пароля (админ задаёт новый временный).
- Без email-based reset в v1 (команда маленькая — админ задаёт временный пароль, пользователь меняет при первом входе — опционально).

### Claude's Discretion
- Конкретная структура payload JWT, имя cookie, детали UI login-формы и таблицы пользователей — на усмотрение Claude (следуя существующим shadcn/ui паттернам кодовой базы).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Модели готовы:** `User` (email @unique, passwordHash, isActive, lastLoginAt, phone, telegramId), `Role` (code @unique, permissions Json, name), `UserRole` (составной @@id [userId, roleId]).
- **bcrypt** уже используется в `prisma/seed.ts` (cost 12) — тот же подход для login/создания пользователей.
- **shadcn/ui + Radix + Tailwind** — для login-формы и админки пользователей.
- `src/middleware.ts` — есть заглушка (health passthrough), расширяется до JWT+RBAC.
- `db`/`prisma` синглтоны (`src/lib/db.ts`, `src/lib/db/prisma.ts`) — для запросов.

### Established Patterns
- API routes: `GET/POST /api/resource`, `GET/PATCH/DELETE /api/resource/[id]`.
- Список + детальная страница для UX-консистентности.
- Decimal-normalized client (см. STEP-2-SCHEMA).

### Integration Points
- middleware.ts — точка RBAC-проверки.
- Шапка (header) — текущий пользователь + «Выйти» (появится в Phase 3 UI-редизайн; здесь — минимально).
- Редирект `/` → сейчас `/crm/contacts`; после Phase 3 станет CRM-канбан. Здесь оставить как есть (Phase 3 поправит).

</code_context>

<specifics>
## Specific Ideas
- Админ задаёт временный пароль при создании пользователя (без email-reset) — упрощает v1 для малой команды.
- «Remain logged in» 7 дней — внутренний инструмент, не хочется логиниться каждый день.

</specifics>

<deferred>
## Deferred Ideas
- Email-based password reset (если команда вырастет).
- OAuth/SSO.
- Принудительная смена пароля при первом входе (опционально, можно добавить).
- Двухфакторная аутентификация.
- Audit log входов (AuditLog модель есть — можно логировать позже).

</deferred>
