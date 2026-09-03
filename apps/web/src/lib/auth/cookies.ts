/** Имя session-cookie и опции. JWT хранится в httpOnly-cookie (не доступен из JS). */
export const SESSION_COOKIE = 'pro_session';

export const sessionCookieOptions = {
  httpOnly: true,
  // Secure-флаг только за HTTPS. Для локального тестирования production-сборки
  // по HTTP можно задать SESSION_COOKIE_SECURE=false (иначе браузер не отправляет
  // Secure-cookie по http://localhost).
  secure:
    process.env.NODE_ENV === 'production' &&
    process.env.SESSION_COOKIE_SECURE !== 'false',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 дней — внутренний инструмент, «remain logged in»
};
