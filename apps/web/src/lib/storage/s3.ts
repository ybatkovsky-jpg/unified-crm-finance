/**
 * Storage Client — S3/MinIO или локальная файловая система (dev fallback).
 *
 * Если S3_ENDPOINT задан — используется S3/MinIO.
 * Иначе файлы сохраняются локально в STORAGE_LOCAL_DIR (по умолчанию .local-uploads/)
 * и отдаются через /api/files/[id]/download.
 *
 * Переменные окружения (S3):
 * - S3_ENDPOINT: MinIO/S3 endpoint URL
 * - S3_ACCESS_KEY: Access key ID
 * - S3_SECRET_KEY: Secret access key
 * - S3_BUCKET: Bucket name
 * - S3_FORCE_PATH_STYLE: Set "true" for MinIO
 * - S3_REGION: defaults to us-east-1
 *
 * Переменные окружения (local):
 * - STORAGE_LOCAL_DIR: путь для локального хранения (по умолчанию .local-uploads)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// ── Определение стратегии хранения ──────────────────────────────────────
let _useS3: boolean | null = null;
function isS3Configured(): boolean {
  if (_useS3 !== null) return _useS3;
  _useS3 = !!(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY && process.env.S3_BUCKET);
  return _useS3;
}

// ── S3 Client (только если сконфигурирован) ─────────────────────────────
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!isS3Configured()) throw new Error('S3 not configured — use local storage');
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT!,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }
  return s3Client;
}

function getBucket(): string {
  if (!isS3Configured()) throw new Error('S3 not configured — use local storage');
  return process.env.S3_BUCKET!;
}

// ── Local filesystem helpers ─────────────────────────────────────────────
function getLocalDir(): string {
  const dir = path.resolve(process.env.STORAGE_LOCAL_DIR || '.local-uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function localPath(storageKey: string): string {
  // storageKey использует forward-slashes — конвертируем в OS-путь
  return path.join(getLocalDir(), ...storageKey.split('/'));
}

async function localUpload(key: string, buffer: Buffer | Uint8Array): Promise<string> {
  const filePath = localPath(key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return key;
}

async function localDelete(key: string): Promise<void> {
  const filePath = localPath(key);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function localUrl(key: string): string {
  // Возвращаем API-endpoint для скачивания файла
  const encoded = encodeURIComponent(key);
  return `/api/files/download?key=${encoded}`;
}

// ── Public API ───────────────────────────────────────────────────────────

export async function uploadFile(
  key: string,
  stream: Buffer | Uint8Array,
  mimeType: string,
): Promise<string> {
  if (isS3Configured()) {
    const client = getS3Client();
    const bucket = getBucket();
    try {
      await client.send(new PutObjectCommand({
        Bucket: bucket, Key: key, Body: stream, ContentType: mimeType,
      }));
      return key;
    } catch (error) {
      console.error('S3 upload failed:', { key, error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Local fallback
  try {
    await localUpload(key, stream);
    return key;
  } catch (error) {
    console.error('Local upload failed:', { key, error: error instanceof Error ? error.message : String(error) });
    throw new Error(`Failed to upload file locally: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteFile(key: string): Promise<void> {
  if (isS3Configured()) {
    const client = getS3Client();
    const bucket = getBucket();
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return;
    } catch (error) {
      console.error('S3 deletion failed:', { key, error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await localDelete(key);
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (isS3Configured()) {
    const client = getS3Client();
    const bucket = getBucket();
    try {
      return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
    } catch (error) {
      console.error('Failed to generate presigned URL:', { key, error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Local URL через API
  return localUrl(key);
}

export function generateStorageKey(fileName: string, entityType: string, entityId: string): string {
  const timestamp = Date.now();
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    || 'file';
  return `${entityType}/${entityId}/${timestamp}-${sanitized}`;
}

/** Проверить, используется ли сейчас S3 (для диагностики). */
export function storageMode(): 's3' | 'local' {
  return isS3Configured() ? 's3' : 'local';
}
