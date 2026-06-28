/**
 * Матрица ролей и прав (PRODUCT-SPEC п.1).
 * Единый источник правды: middleware (section-RBAC), UI (видимость меню), seed.
 * Пользователь может иметь НЕСКОЛЬКО ролей — права = объединение (union).
 */

export type RoleCode =
  | 'director'
  | 'manager_designer'
  | 'technologist'
  | 'supply'
  | 'installer'
  | 'accountant'
  | 'storekeeper';

export type Section =
  | 'crm'
  | 'projects'
  | 'procurement'
  | 'finance'
  | 'accounting'
  | 'analytics'
  | 'settings';

export interface RoleSpec {
  label: string;
  sections: Section[];
  viewAllProjects: boolean;
}

export const ROLE_MATRIX: Record<RoleCode, RoleSpec> = {
  director: {
    label: 'Директор',
    sections: ['crm', 'projects', 'procurement', 'finance', 'accounting', 'analytics', 'settings'],
    viewAllProjects: true,
  },
  manager_designer: {
    label: 'Менеджер-дизайнер',
    sections: ['crm', 'projects', 'procurement', 'finance', 'analytics'],
    viewAllProjects: false,
  },
  technologist: {
    label: 'Технолог',
    sections: ['projects', 'procurement', 'analytics'],
    viewAllProjects: true,
  },
  supply: {
    label: 'Снабженец',
    sections: ['projects', 'procurement', 'finance', 'analytics'],
    viewAllProjects: true,
  },
  installer: {
    label: 'Монтажник',
    sections: ['projects', 'analytics'],
    viewAllProjects: false,
  },
  accountant: {
    label: 'Бухгалтер',
    sections: ['finance', 'accounting', 'analytics', 'procurement'],
    viewAllProjects: true,
  },
  storekeeper: {
    label: 'Кладовщик',
    sections: ['procurement'],
    viewAllProjects: false,
  },
};

export const ALL_ROLES = Object.keys(ROLE_MATRIX) as RoleCode[];

export function isRoleCode(code: string): code is RoleCode {
  return code in ROLE_MATRIX;
}

/** Список ролей → объединение доступных разделов. */
export function effectiveSections(roleCodes: RoleCode[]): Section[] {
  const set = new Set<Section>();
  for (const code of roleCodes) {
    for (const s of ROLE_MATRIX[code].sections) set.add(s);
  }
  return [...set];
}

/** Видит ВСЕ проекты, если хотя бы одна роль это разрешает. */
export function canViewAllProjects(roleCodes: RoleCode[]): boolean {
  return roleCodes.some((c) => ROLE_MATRIX[c]?.viewAllProjects);
}

/** Есть ли доступ к разделу по любому из ролей. */
export function hasSection(roleCodes: RoleCode[], section: Section): boolean {
  return roleCodes.some((c) => ROLE_MATRIX[c]?.sections.includes(section));
}

/** Маппинг пути → раздел (для middleware RBAC). */
export function pathToSection(pathname: string): Section | null {
  if (
    pathname.startsWith('/crm') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/contacts') ||
    pathname.startsWith('/contracts')
  ) {
    return 'crm';
  }
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/procurement')) return 'procurement';
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/accounting')) return 'accounting';
  if (pathname.startsWith('/analytics')) return 'analytics';
  if (pathname.startsWith('/settings')) return 'settings';
  return null;
}
