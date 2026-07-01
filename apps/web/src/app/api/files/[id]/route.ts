/**
 * Single File API Endpoint
 *
 * File management API:
 * - GET: Fetch file metadata and generate presigned download URL
 * - DELETE: Soft-delete a file (marks as deleted, optionally removes from MinIO)
 *
 * GET /api/files/[id]
 * DELETE /api/files/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { files } from '../../../../lib/db/files'
import { getPresignedUrl, deleteFile as deleteFromStorage } from '../../../../lib/storage/s3'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/files/[id]
 *
 * Fetches file metadata and generates a presigned URL for temporary download access.
 * Returns 404 if file doesn't exist or is soft-deleted.
 *
 * Query params:
 * - expiresIn: URL expiration time in seconds (default: 3600 = 1 hour, max: 86400 = 24 hours)
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    const file = await files.findUnique(id)

    if (!file) {
      return NextResponse.json(
        { error: 'Not found', message: `File with id ${id} not found` },
        { status: 404 }
      )
    }

    // Parse expiresIn from query params (max 24 hours)
    const searchParams = request.nextUrl.searchParams
    let expiresIn = Number(searchParams.get('expiresIn')) || 3600
    if (expiresIn < 60) expiresIn = 60 // Minimum 1 minute
    if (expiresIn > 86400) expiresIn = 86400 // Maximum 24 hours

    // Generate presigned URL
    let presignedUrl: string
    try {
      presignedUrl = await getPresignedUrl(file.storageKey, expiresIn)
    } catch (urlError) {
      console.error('Failed to generate presigned URL:', urlError)
      return NextResponse.json(
        {
          error: 'Failed to generate download URL',
          message: urlError instanceof Error ? urlError.message : 'Storage service unavailable',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      data: {
        file,
        downloadUrl: presignedUrl,
        expiresIn,
      },
    })
  } catch (error) {
    console.error('Failed to fetch file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/files/[id]
 *
 * Soft-deletes a file by setting deletedAt timestamp.
 * Optionally removes the file from MinIO/S3 storage as well.
 * Returns 404 if file doesn't exist.
 *
 * Query params:
 * - removeFromStorage: Set 'true' to also delete the file from MinIO/S3 (default: false)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    // Check if file exists before deletion
    const existingFile = await files.findUnique(id)
    if (!existingFile) {
      return NextResponse.json(
        { error: 'Not found', message: `File with id ${id} not found` },
        { status: 404 }
      )
    }

    // Админ — всё; остальные — только свои файлы (uploadedBy может быть null).
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!canModify(session, !!existingFile.uploadedBy && existingFile.uploadedBy === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if we should also remove from storage
    const searchParams = request.nextUrl.searchParams
    const removeFromStorage = searchParams.get('removeFromStorage') === 'true'

    if (removeFromStorage) {
      try {
        await deleteFromStorage(existingFile.storageKey)
      } catch (storageError) {
        console.error('Failed to delete file from storage:', storageError)
        // Continue with soft-delete even if storage deletion fails
        // Log the failure but don't block the operation
      }
    }

    // Soft-delete the FileEntity record
    const deletedFile = await files.softDelete(id)

    return NextResponse.json(
      {
        data: deletedFile,
        message: 'File soft-deleted successfully',
        removedFromStorage: removeFromStorage,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Check if this is a "not found" error from repository
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    console.error('Failed to delete file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file', message },
      { status: 500 }
    )
  }
}
