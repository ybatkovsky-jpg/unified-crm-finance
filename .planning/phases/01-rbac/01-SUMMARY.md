# Phase 1 Summary: Доступ и авторизация (RBAC)

**Status:** Complete ✅ (verified PASSED, см. 01-VERIFICATION.md)

## Что сделано
- **Auth-ядро:** JWT-сессия (jose, Edge) в httpOnly-cookie (7d), bcrypt (cost 12), `src/lib/auth/{password,jwt,cookies,roles,session}.ts`.
- **API:** `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- **Middleware:** auth-gate (без сессии → /login; API → 401) + section-RBAC по матрице ролей.
- **Роли:** 7 ролей спеки (director/manager_designer/technologist/supply/installer/accountant/storekeeper) в seed с permissions-матрицей; admin@local → director.
- **UI:** `/login` (форма входа), `/settings/users` (админка директора: создание, смена роли, блокировка, сброс пароля), NavBar — скрыт на /login + кнопка «Выйти».

## Files
- `apps/web/src/lib/auth/*.ts` (5)
- `apps/web/src/app/api/auth/{login,logout,me}/route.ts`
- `apps/web/src/app/api/users/route.ts`, `apps/web/src/app/api/users/[id]/route.ts`
- `apps/web/src/app/login/page.tsx`, `apps/web/src/app/settings/users/page.tsx`
- `apps/web/src/middleware.ts`, `apps/web/src/components/nav-bar.tsx`
- `apps/web/prisma/seed.ts`, `apps/web/.env` (AUTH_SECRET; jwt.ts имеет dev-fallback)
- dep: `jose`

## Verification
End-to-end smoke (curl): 307→/login без cookie; login 200 (director); /me 200; logout→401; /api/users 200 director; /settings/users 200; 0 новых tsc-ошибок. Человеческая проверка: http://localhost:3000 → /login → admin@local/admin123.

## На заметку следующим фазам
- Проектная видимость (manager_designer видит только свои проекты) — section-RBAC есть в middleware; **по-проектная** фильтрация на уровне запросов/страниц — добавить в фазах 4–5 (CRM/проекты) при работе с конкретными проектами.
- UI login/админки — функциональный; полный дизайн-язык — **фаза 3** (UI-редизайн).
- Предсуществующие ~40 ошибок типов и мёртвые тесты — НЕ тронуты (это **фаза 2 CORE**).
