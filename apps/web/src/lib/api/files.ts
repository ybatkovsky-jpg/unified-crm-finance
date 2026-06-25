/**
 * Files API Client
 *
 * TypeScript client for File API with fetch wrapper.
 * Provides typed methods for file upload, retrieval, and deletion.
 */

import type { ApiResponse, ApiClientConfig } from './types';
import { ApiClientError, parseApiError, parseJson } from './shared';

export { ApiClientError } from './shared';

/**
 * Default base URL for API requests
 */
const DEFAULT_BASE_URL = '/api';

/**
 * File entity data (mirrors Prisma FileEntity model)
 */
export interface FileEntityData {
  id: string;
  fileName: string;
  storageKey: string;
  mimeType: string | null;
  size: number;
  bucket: string;
  uploadedBy: string | null;
  createdAt: Date;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  file: FileEntityData;
  downloadUrl?: string;
  expiresIn?: number;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  file: File;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Files API Client
 */
export class FilesApiClient {
  private baseUrl: string;
  private fetchFn: typeof globalThis.fetch;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = config.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
    this.defaultHeaders = {
      ...config.headers,
    };
  }

  /**
   * Build full URL for endpoint
   */
  private url(path: string, params?: Record<string, string | undefined>): string {
    const fullUrl = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        return `${fullUrl}?${queryString}`;
      }
    }

    return fullUrl;
  }

  /**
   * POST /api/files
   *
   * Upload a file via multipart form data.
   */
  async uploadFile(options: FileUploadOptions): Promise<ApiResponse<FileEntityData>> {
    const { file, entityType = 'general', entityId = 'temp', uploadedBy, onProgress } = options;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }

    // Use XMLHttpRequest for progress tracking if needed
    if (onProgress && typeof XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (err) {
              reject(new ApiClientError(xhr.status, 'Invalid response', 'Failed to parse JSON response'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new ApiClientError(xhr.status, error.error || 'Upload failed', error.message || 'Unknown error'));
            } catch {
              reject(new ApiClientError(xhr.status, 'Upload failed', xhr.statusText));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new ApiClientError(0, 'Network error', 'Failed to upload file'));
        });

        xhr.open('POST', this.url('/files'));
        for (const [key, value] of Object.entries(this.defaultHeaders)) {
          if (key.toLowerCase() !== 'content-type') {
            xhr.setRequestHeader(key, value);
          }
        }
        xhr.send(formData);
      });
    }

    // Fallback to fetch if no progress tracking needed
    const response = await this.fetchFn(this.url('/files'), {
      method: 'POST',
      headers: this.defaultHeaders,
      body: formData,
    });

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<FileEntityData>>(response);
  }

  /**
   * GET /api/files/[id]
   *
   * Fetch file metadata and generate presigned download URL.
   */
  async getFile(id: string, expiresIn?: number): Promise<ApiResponse<FileUploadResponse>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/files/${id}`, { expiresIn: expiresIn?.toString() }),
      {
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<FileUploadResponse>>(response);
  }

  /**
   * DELETE /api/files/[id]
   *
   * Soft-delete a file by setting deletedAt timestamp.
   */
  async deleteFile(id: string, removeFromStorage = false): Promise<ApiResponse<FileEntityData>> {
    if (!id) {
      throw new ApiClientError(400, 'Validation failed', 'id is required');
    }

    const response = await this.fetchFn(
      this.url(`/files/${id}`, { removeFromStorage: removeFromStorage ? 'true' : undefined }),
      {
        method: 'DELETE',
        headers: this.defaultHeaders,
      }
    );

    if (!response.ok) {
      return parseApiError(response);
    }

    return parseJson<ApiResponse<FileEntityData>>(response);
  }
}

/**
 * Default singleton instance
 */
export const filesApi = new FilesApiClient();

/**
 * Convenience exports
 */
export const {
  uploadFile,
  getFile,
  deleteFile,
} = filesApi;

export default filesApi;
