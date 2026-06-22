/**
 * S3/MinIO Storage Client
 *
 * Provides file upload, deletion, and presigned URL generation for MinIO/S3.
 * Configured via environment variables:
 * - S3_ENDPOINT: MinIO/S3 endpoint URL
 * - S3_ACCESS_KEY: Access key ID
 * - S3_SECRET_KEY: Secret access key
 * - S3_BUCKET: Bucket name
 * - S3_FORCE_PATH_STYLE: Set "true" for MinIO
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 client singleton
let s3Client: S3Client | null = null;

/**
 * Get or create the S3 client instance
 */
function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const bucket = process.env.S3_BUCKET;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'Missing S3 configuration. Ensure S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, and S3_BUCKET are set.'
      );
    }

    s3Client = new S3Client({
      endpoint,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }
  return s3Client;
}

/**
 * Get the configured bucket name
 */
function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('S3_BUCKET environment variable is not set');
  }
  return bucket;
}

/**
 * Upload a file to S3/MinIO
 *
 * @param key - Storage key (path within bucket)
 * @param stream - File content as Buffer or Uint8Array
 * @param mimeType - Content type (e.g., 'application/pdf', 'image/jpeg')
 * @returns The storage key
 */
export async function uploadFile(
  key: string,
  stream: Buffer | Uint8Array,
  mimeType: string
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: mimeType,
    });

    await client.send(command);
    return key;
  } catch (error) {
    console.error('S3 upload failed:', { key, error: error instanceof Error ? error.message : String(error) });
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete a file from S3/MinIO
 *
 * @param key - Storage key of the file to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error('S3 deletion failed:', { key, error: error instanceof Error ? error.message : String(error) });
    throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a presigned URL for temporary access
 *
 * @param key - Storage key
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL string
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('Failed to generate presigned URL:', { key, error: error instanceof Error ? error.message : String(error) });
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a unique storage key for uploads
 *
 * @param fileName - Original file name
 * @param entityType - Entity type (e.g., 'deal', 'project')
 * @param entityId - Entity ID
 * @returns Storage key in format: {entityType}/{entityId}/{timestamp}-{sanitized-filename}
 */
export function generateStorageKey(fileName: string, entityType: string, entityId: string): string {
  const timestamp = Date.now();
  // Sanitize filename: remove special chars, replace spaces with dashes
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    || 'file';

  return `${entityType}/${entityId}/${timestamp}-${sanitized}`;
}
