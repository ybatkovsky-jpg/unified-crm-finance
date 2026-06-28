/** Имя session-cookie и опции. JWT хранится в httpOnly-cookie (не доступен из JS). */
export const SESSION_COOKIE = 'pro_session';

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 дней — внутренний инструмент, «remain logged in»
};
