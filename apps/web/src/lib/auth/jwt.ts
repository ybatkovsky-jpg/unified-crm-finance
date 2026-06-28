import { SignJWT, jwtVerify } from 'jose';

/**
 * JWT-сессия (jose — Edge-compatible, работает в middleware).
 * Секрет — AUTH_SECRET из env (fallback на dev-секрет только вне прод).
 */
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-insecure-secret-change-me'
);
const ISSUER = 'pro-mebel-erp';
const AUDIENCE = 'pro-mebel-erp-users';

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  roleCode: string;
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ email: p.email, name: p.name, roleCode: p.roleCode })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      roleCode: payload.roleCode as string,
    };
  } catch {
    return null;
  }
}
