import { SignJWT, jwtVerify } from 'jose';

if (!process.env.AUTH_SECRET) {
  throw new Error('FATAL: AUTH_SECRET environment variable is required');
}
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
const ISSUER = process.env.AUTH_ISSUER || 'pro-mebel-erp';
const AUDIENCE = process.env.AUTH_AUDIENCE || 'pro-mebel-erp-users';

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  roleCodes: string[]; // может быть несколько ролей
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ email: p.email, name: p.name, roleCodes: p.roleCodes })
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
    const roleCodes = Array.isArray(payload.roleCodes)
      ? (payload.roleCodes as string[])
      : typeof payload.roleCodes === 'string'
        ? [payload.roleCodes]
        : [];
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      roleCodes,
    };
  } catch {
    return null;
  }
}
