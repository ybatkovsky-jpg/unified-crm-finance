/**
 * Дефолтные этапы проекта (7, по ROADMAP Phase 5): Замер #2 → ТЗ/спецификация →
 * Закупки → Производство → Монтаж → Акт → Закрытие.
 *
 * Общий источник правды для всех точек создания проекта
 * (ручное создание и конвертация сделки).
 */
export const DEFAULT_PROJECT_STAGES = [
  { code: 'measurement_2', name: 'Замер #2', order: 1 },
  { code: 'specification', name: 'ТЗ / Спецификация', order: 2 },
  { code: 'procurement', name: 'Закупки', order: 3 },
  { code: 'production', name: 'Производство', order: 4 },
  { code: 'installation', name: 'Монтаж', order: 5 },
  { code: 'acceptance', name: 'Акт', order: 6 },
  { code: 'closure', name: 'Закрытие', order: 7 },
] as const
