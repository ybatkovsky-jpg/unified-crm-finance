import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';
import { SESSION_COOKIE } from '@/lib/auth/cookies';
import {
  pathToSection,
  isRoleCode,
  ROLE_MATRIX,
  effectiveSections,
} from '@/lib/auth/roles';

const PUBLIC = new Set(['/login', '/api/health']);
const PUBLIC_PREFIXES = ['/api/auth/', '/_next/'];

const SECTION_HOME: Record<string, string> = {
  crm: '/deals',
  projects: '/projects',
  procurement: '/procurement',
  finance: '/finance',
  accounting: '/accounting',
  analytics: '/analytics',
  settings: '/settings',
};

function roleHome(rawRoleCodes: string[]): string {
  const codes = rawRoleCodes.filter(isRoleCode);
  const sections = effectiveSections(codes);
  const first = sections[0] ?? 'crm';
  return SECTION_HOME[first] ?? '/deals';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySession(token) : null;
  const roleCodes = (payload?.roleCodes ?? []).filter(isRoleCode);

  // API — без сессии 401
  if (pathname.startsWith('/api/')) {
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.next();
    response.headers.set('X-Request-Id', request.headers.get('X-Request-Id') || crypto.randomUUID());
    return response;
  }

  // Страницы — без сессии → /login?next=...
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Section-RBAC: доступ через ЛЮБУЮ из ролей (union)
  const section = pathToSection(pathname);
  if (section && !roleCodes.some((c) => ROLE_MATRIX[c]?.sections.includes(section))) {
    const url = request.nextUrl.clone();
    url.pathname = roleHome(payload.roleCodes);
    url.search = '';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', request.headers.get('X-Request-Id') || crypto.randomUUID());
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
