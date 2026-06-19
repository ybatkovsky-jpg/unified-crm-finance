import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединяет классы Tailwind с учётом конфликтов
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование даты в русском формате: DD.MM.YYYY
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Форматирование даты и времени: DD.MM.YYYY HH:MM
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Форматирование денег: 1 234 567 ₽
 */
export function formatMoney(amount: number, currency = 'RUB'): string {
  const symbol = currency === 'RUB' ? '₽' : currency;
  return `${new Intl.NumberFormat('ru-RU').format(amount)} ${symbol}`;
}

/**
 * Генерация человекочитаемого номера: С-2026-00001
 */
export function generateNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(5, '0')}`;
}
