import { NextRequest, NextResponse } from 'next/server';

/**
 * Базовый middleware — будет расширен в S2:
 * - проверка JWT-токена
 * - RBAC-проверки
 * - rate limiting
 * - CSRF-защита
 *
 * Сейчас: логирование + проверка health endpoint.
 */
export function middleware(request: NextRequest) {
  // Health endpoint — без auth
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // TODO(S2): добавить проверку JWT для /api/v1/* эндпоинтов
  // TODO(S2): добавить rate limiting
  // TODO(S2): добавить CSRF-проверку для POST/PUT/DELETE

  // Передаём correlationId для трассировки (см. ADR-02)
  const requestId =
    request.headers.get('X-Request-Id') ||
    crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set('X-Request-Id', requestId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Применять middleware ко всем маршрутам кроме:
     * - _next/static (статика)
     * - _next/image (оптимизация изображений)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
