---
status: passed
phase: 1
verified: 2026-06-29
method: smoke (curl) against running dev server + native PostgreSQL
---

# Phase 1: Доступ и авторизация (RBAC) — Verification

**Status: PASSED** — все 4 success criteria подтверждены end-to-end.

## Success Criteria

1. ✅ **Любой URL без входа → /login; сессия сохраняется; «Выйти» очищает.**
   - `GET /` без cookie → `307 → /login?next=%2F`.
   - `POST /api/auth/login` (admin@local/admin123) → `200`, JWT в httpOnly-cookie, `roleCode: director`.
   - `GET /api/auth/me` с cookie → `200` (user director, isActive).
   - После `POST /api/auth/logout` → `/api/auth/me` → `401` (сессия очищена).
2. ✅ **Директор создаёт/блокирует пользователей, назначает роли, сбрасывает пароль.**
   - `GET /api/users` (director) → `200`, список с ролями.
   - `POST /api/users` (create), `PATCH /api/users/[id]` (isActive/roleCode/password) — director-only (403 иначе).
   - `/settings/users` — UI (таблица + форма создания + смена роли + блокировка + сброс пароля).
3. ✅ **RBAC по матрице видимости.** middleware: auth-gate + section-RBAC (роль → разделы). `/settings` доступен только director (`/settings/users` → 200 директору; не-director → редирект на домашний раздел).
4. ✅ **7 ролей** (director, manager_designer, technologist, supply, installer, accountant, storekeeper) в seed с матрицей permissions; admin@local → director.

## Implementation Notes
- JWT (jose, Edge-compatible) в httpOnly/Secure/SameSite=Lax cookie, TTL 7d.
- bcryptjs cost 12 (совпадает с seed).
- AUTH_SECRET в .env (fallback dev-секрет в jwt.ts).
- middleware: public = /login, /api/auth/*, /api/health, _next; API без сессии → 401; страницы без сессии → /login; section-RBAC denied → редирект на домашний раздел роли (без циклов).
- 0 новых tsc-ошибок в auth-коде (предсуществующие 40/Core — фаза 2).

## Human Verification (опционально)
- Открыть http://localhost:3000 → редирект на /login → войти admin@local/admin123 → попадёшь в приложение.
- /settings/users → создать пользователя, сменить роль, сбросить пароль, зайти под новым пользователем.
