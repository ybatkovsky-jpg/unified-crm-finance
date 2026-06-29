---
status: passed
phase: 3
verified: 2026-06-29
method: tsc --noEmit + next build + curl smoke against dev server
---

# Phase 3: UI-редизайн — Verification

**Status: PASSED.**

## Success Criteria

1. ✅ **`tsc --noEmit` → 0.** (64 ошибок `.next/types` кэша исчезли после
   `rm -rf .next`; реальный код — 0 ошибок.)
2. ✅ **`next build` → exit 0.** `✓ Compiled`, `Finished TypeScript`, все
   страницы в `(app)/` сгенерированы, `/login` и `/` вне группы.
3. ✅ **App-shell рендерится на app-страницах.** `/crm/contacts` (200, 35KB) и
   `/deals` (200) содержат маркеры `ПРО Мебель` + `Свернуть`.
4. ✅ **`/login` без shell.** `data-slot="sidebar"` = 0, `sidebar-active` = 0.
   «ПРО Мебель» на /login — только `<title>` и `<h1>` формы (корректно).

## Smoke (curl, cookie admin@local)

```
POST /api/auth/login              → 200
GET  /crm/contacts (shell)        → 200, 35494 bytes, markers: ПРО Мебель, Свернуть
GET  /deals (shell)               → 200
GET  /login (no shell)            → 200, data-slot="sidebar"=0, sidebar-active=0
next build                        → exit 0, 59+ pages
```

## Что доставлено

- **Route group `(app)/`**: 8 модулей (crm/analytics/contracts/deals/finance/
  procurement/projects/settings) перенесены под общий layout с shell. URL не
  изменился. `/login`, `/` и `/api` вне группы.
- **Sidebar** (`components/layout/sidebar.tsx`): бренд «ПРО Мебель» + SofaIcon,
  5 разделов с lucide-иконками, spring-animated active-pill (`layoutId`),
  collapsible в иконки (state в localStorage), mobile drawer (backdrop + slide).
- **Topbar** (`components/layout/topbar.tsx`): название активного раздела +
  поднав дочерних страниц (AnimatePresence переход между разделами), справа
  ThemeToggle + NotificationBell + user menu (avatar + logout).
- **Единый nav-config** (`nav-config.ts`): источник истины для разделов и
  дочерних ссылок; `directorOnly` фильтрует «Настройки» для не-директоров.
- **Тема**: next-themes Provider, акцентный индиго `--primary` (OKLCH), dark
  toggle, плавные `transition-colors`. `--sidebar-width`/`--topbar-height` токены.
- **useMe** хук: один запрос `/api/auth/me` для sidebar + topbar (вместо
  отдельных в каждом).

## Human Verification (рекомендуется)

- http://localhost:3000 → переключение разделов (плавный pill-индикатор).
- Dark/light toggle в правом верхнем углу.
- Свернуть сайдбар (кнопка внизу) → иконки; на mobile → burger → drawer.
- `/settings/users` виден только director.
