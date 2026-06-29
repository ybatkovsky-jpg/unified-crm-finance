---
phase: 3
status: complete
completed: 2026-06-29
---

# Phase 3: UI-редизайн — Summary

**Результат:** навигация перестроена под ERP-масштаб. Фиксированный сайдбар с
разделами + верхний поднав, акцентный брендовый цвет, тёмная тема, плавный
framer-motion. `tsc`/`next build` остаются чистыми (0 ошибок).

## Что сделано

### Навигация
- **Route group `(app)/`** — 8 модулей под общим layout с shell; URL не изменился.
- **Sidebar** — бренд «ПРО Мебель» + SofaIcon, 5 разделов (CRM/Закупки/Финансы/
  Аналитика/Настройки), spring-индикатор активного раздела (`layoutId`), collapse
  в иконки (localStorage), mobile drawer (backdrop + slide).
- **Topbar** — название раздела + поднав дочерних страниц (AnimatePresence),
  справа: ThemeToggle + NotificationBell + user menu (avatar + logout).
- **nav-config.ts** — единый источник разделов/ссылок; `directorOnly` прячет
  «Настройки» от недиректоров.

### Тема и motion
- **framer-motion** — переходы поднава между разделами, spring-active-pill,
  micro-interactions (user menu, drawer).
- **next-themes** — Provider + dark/light toggle (Sun/Moon), `suppressHydrationWarning`.
- **Акцент** — индиго `--primary` (OKLCH) в светлом/тёмном; остальная палитра
  нейтральная, акцент читается как брендовый сигнал.
- Токены `--sidebar-width`, `--topbar-height`, плавные `transition-colors`.

### Инфра
- **useMe** хук — один запрос на sidebar+topbar (было по fetch в каждом).
- Удалён устаревший `nav-bar.tsx`.

## Метрики

| Метрика | До | После |
|---|---|---|
| Тип навигации | плоский топ-бар, 15 пунктов | сайдбар + поднав, 5 разделов |
| Motion | tw-animate-css (CSS) | framer-motion (spring/layout) |
| Тема | grayscale, без toggle | акцент + dark toggle |
| `tsc --noEmit` | 0 | **0** |
| `next build` | exit 0 | **exit 0** |

## Не делалось (вне фазы)

Бизнес-логика разделов (CRM-процессы, видимость проектов, источники лида) —
фазы 4+. Фаза 3 = только оболочка/навигация/тема.

## Замечания / известные ограничения

- `notification-bell.tsx` ещё использует `MOCK_USER_ID` (pre-existing, MVP) —
  вне scope фазы 3; подтянется в фазе с реальными уведомлениями.
- Collapse сайдбара сдвигает fixed-rail, но контент держит отступ expand-ширины
  (небольшое перекрытие при collapsed на десктопе) — приемлемо для MVP,
  можно уточнить через CSS-переменную-состояния позже.

## Следующая фаза

**Фаза 4 — CRM/жизненный цикл сделки:** источники лида, КП-версионирование,
причины отказа, видимость проектов. Теперь, когда оболочка готова и навигация
структурирована, можно уверенно строить функциональные модули.
