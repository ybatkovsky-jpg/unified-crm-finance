/**
 * Files API Endpoint
 *
 * File upload API:
 * - POST: Upload a file (multipart form data), validates size/type, stores in S3/MinIO, creates FileEntity record
 *
 * POST /api/files
 */

import { NextRequest, NextResponse } from 'next/server'
import { files } from '../../../lib/db/files'
import { uploadFile, generateStorageKey } from '../../../lib/storage/s3'

// Max upload size from environment (default 50MB)
const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE_MB || 50) * 1024 * 1024

// Allowed MIME types for upload (can be extended)
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/json',
])

/**
 * POST /api/files
 *
 * Uploads a file via multipart form data.
 * Validates file size and MIME type, uploads to S3/MinIO, creates FileEntity record.
 *
 * Form fields:
 * - file: The file to upload (required)
 * - entityType: Entity type for storage key organization (optional, default: 'general')
 * - entityId: Entity ID for storage key organization (optional, default: 'temp')
 * - uploadedBy: User ID who is uploading (optional)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const entityType = (formData.get('entityType') as string) || 'general'
    const entityId = (formData.get('entityId') as string) || 'temp'
    const uploadedBy = (formData.get('uploadedBy') as string) || null

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'file is required' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: `File size exceeds maximum allowed size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`,
        },
        { status: 413 } // 413 Payload Too Large
      )
    }

    // Validate MIME type
    const mimeType = file.type || 'application/octet-stream'
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      console.warn('Blocked file upload with disallowed MIME type:', { mimeType, fileName: file.name })
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: `File type ${mimeType} is not allowed`,
        },
        { status: 415 } // 415 Unsupported Media Type
      )
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate storage key
    const storageKey = generateStorageKey(file.name, entityType, entityId)

    // Upload to S3/MinIO
    try {
      await uploadFile(storageKey, buffer, mimeType)
    } catch (uploadError) {
      console.error('File upload to storage failed:', uploadError)
      return NextResponse.json(
        {
          error: 'Upload failed',
          message: uploadError instanceof Error ? uploadError.message : 'Failed to upload file to storage',
        },
        { status: 503 } // 503 Service Unavailable
      )
    }

    // Create FileEntity record
    const newFile = await files.create({
      fileName: file.name,
      storageKey,
      mimeType,
      size: file.size,
      bucket: process.env.S3_BUCKET || 'default',
      uploadedBy,
    })

    return NextResponse.json({ data: newFile }, { status: 201 })
  } catch (error) {
    console.error('Failed to process file upload:', error)
    return NextResponse.json(
      { error: 'Failed to process file upload', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/files
 *
 * Lists files with optional filtering.
 * Query params:
 * - uploadedBy: Filter by uploader user ID
 * - limit: Maximum number of results (default 50)
 * - offset: Number of results to skip
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const uploadedBy = searchParams.get('uploadedBy')
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0

    const where: Record<string, unknown> = {}
    if (uploadedBy) where.uploadedBy = uploadedBy

    const allFiles = await files.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({ data: allFiles, count: allFiles.length })
  } catch (error) {
    console.error('Failed to fetch files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
