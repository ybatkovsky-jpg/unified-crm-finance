# Phase 1: Доступ и авторизация (RBAC) — PLAN

> Источник: `01-CONTEXT.md`. Требования: AUTH-01..05. Стек: Next.js 16, Prisma, jose (JWT Edge), bcrypt.

## Задачи (слайсы)

### A. Auth-ядро (backend)
- **A1.** Установить `jose` (JWT для Edge-middleware). Проверить bcrypt (уже есть в deps? — `@types/bcryptjs`, `bcryptjs` в package.json).
- **A2.** `src/lib/auth/password.ts` — `hashPassword`/`verifyPassword` (bcryptjs, cost 12 — как в seed).
- **A3.** `src/lib/auth/jwt.ts` — `signSession(user)`/`verifySession(token)` через jose (HS256, секрет из env), payload `{ sub, email, name, roleCode }`, TTL 7d.
- **A4.** `src/lib/auth/cookies.ts` — имя cookie, опции (httpOnly, secure, sameSite=lax, path=/), set/clear.
- **A5.** `src/lib/auth/roles.ts` — 7 кодов ролей + матрица разрешений (доступные разделы, `viewAllProjects`).
- **A6.** `src/lib/auth/session.ts` — `getSession()` (server, читает cookie из next/headers, верифицирует, тянет user+role из БД) → `SessionUser | null`.

### B. Auth API
- **B1.** `POST /api/auth/login` — body {email,password} → verify → set cookie → 200 {user}; 401 при ошибке.
- **B2.** `POST /api/auth/logout` — clear cookie → 200.
- **B3.** `GET /api/auth/me` — текущий user/role из getSession.

### C. Middleware RBAC
- **C1.** `src/middleware.ts` — verifySession из cookie; public: `/login`, `/api/auth/*`, `/api/health`, `/_next`, favicon. Иначе нет сессии → редирект `/login`. (Полная section-RBAC — в отдельной мапе; на v1 — auth-gate + мягкая проверка роли по префиксу пути.)

### D. Роли (привести к спеке)
- **D1.** Обновить `prisma/seed.ts`: 7 ролей (director, manager_designer, technologist, supply, installer, accountant, storekeeper) с permissions (Json) по матрице; admin@local → director. Пересеять.
- **D2.** Скрипт/seed не ломает существующие ссылки (UserRole по roleId).

### E. UI
- **E1.** `/login` page — форма (email+password) → POST /api/auth/login → redirect `/`. shadcn Card/Input/Button.
- **E2.** Header/шапка: текущий пользователь + «Выйти» (минимально; Phase 3 рестилит).
- **E3.** `/settings/users` (только director) — таблица пользователей, создание (email, ФИО, роль, временный пароль), блокировка (isActive), сброс пароля.
- **E4.** `/api/users` (GET list, POST create) + `/api/users/[id]` (PATCH isActive/role/password) — director-only (через getSession + role check).

### F. Верификация
- **F1.** Smoke: `POST /api/auth/login` admin@local → 200 + cookie; `/api/auth/me` → user; защищённый маршрут без cookie → 307→/login; logout очищает.
- **F2.** `npx tsc --noEmit` — auth-код без ошибок (предсуществующие 40/Core — не трогать).
- **F3.** Коммит + обновить STATE.md/ROADMAP.md (Phase 1 → complete).

## Риски
- bcryptjs vs node bcrypt — в seed используется `bcryptjs` (deps есть). Соответствие hash/verify — тот же модуль.
- middleware Edge — jose обязателен (jsonwebtoken не работает в Edge). jose в Edge-runtime.
- Существующие страницы могут ломаться при включении auth-gate (редирект на /login) — ожидаемо, это и есть AUTH-01.
