/**
 * SettingRepository — простой key-value репозиторий для настроек приложения.
 * Использует существующую модель Setting (поле permissions Json не используется).
 */

import { prisma } from './prisma';
import { randomUUID } from 'node:crypto';

const BRAND_LOGO_KEY = 'brand.logoFileId';

class SettingRepository {
  /** Получить значение по ключу (или null). */
  async get(key: string): Promise<string | null> {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  /** Upsert значения по ключу. */
  async set(key: string, value: string): Promise<void> {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { id: randomUUID(), key, value, type: 'string' },
    });
  }

  /** Удалить настройку по ключу (no-op если нет). */
  async delete(key: string): Promise<void> {
    await prisma.setting.deleteMany({ where: { key } });
  }

  // ── Brand-specific wrappers ──────────────────────────────────────────

  /** ID файла логотипа компании (или null). */
  async getBrandLogoFileId(): Promise<string | null> {
    return this.get(BRAND_LOGO_KEY);
  }

  /** Сохранить/заменить ID файла логотипа. */
  async setBrandLogoFileId(fileId: string): Promise<void> {
    await this.set(BRAND_LOGO_KEY, fileId);
  }

  /** Удалить логотип. */
  async clearBrandLogo(): Promise<void> {
    await this.delete(BRAND_LOGO_KEY);
  }
}

export const settings = new SettingRepository();
export default settings;
