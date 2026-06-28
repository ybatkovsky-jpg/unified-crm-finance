import * as bcrypt from 'bcryptjs';

/** bcryp cost 12 — совпадает с prisma/seed.ts. */
export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
