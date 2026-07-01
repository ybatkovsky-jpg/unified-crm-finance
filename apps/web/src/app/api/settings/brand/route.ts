/**
 * Brand Settings API
 *
 * - GET /api/settings/brand  → { logoFileId, logoUrl, fileName } (любой авторизованный)
 * - PUT /api/settings/brand  → { logoFileId: string | null } (admin/director)
 *
 * Логотип хранится как ID FileEntity в Setting (key = 'brand.logoFileId').
 * URL возвращается presigned (истекает ~1ч), клиент пере fetch'ит при необходимости.
 */

import { NextRequest, NextResponse } from 'next/server'
import { settings } from '@/lib/db/settings'
import { files } from '@/lib/db/files'
import { getPresignedUrl } from '@/lib/storage/s3'
import { getSession } from '@/lib/auth/session'
import { isAdminOrDirector } from '@/lib/auth/permissions'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const logoFileId = await settings.getBrandLogoFileId()
    if (!logoFileId) {
      return NextResponse.json({ data: { logoFileId: null, logoUrl: null, fileName: null } })
    }

    const file = await files.findUnique(logoFileId)
    if (!file) {
      return NextResponse.json({ data: { logoFileId: null, logoUrl: null, fileName: null } })
    }

    let logoUrl: string | null = null
    try {
      logoUrl = await getPresignedUrl(file.storageKey, 3600)
    } catch {
      // S3 может быть недоступен — возвращаем метаданные без URL
      logoUrl = null
    }

    return NextResponse.json({
      data: { logoFileId: file.id, logoUrl, fileName: file.fileName },
    })
  } catch (error) {
    console.error('Failed to fetch brand settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand settings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminOrDirector(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const logoFileId: string | null = body.logoFileId ?? null

    if (logoFileId) {
      // Проверяем что файл существует.
      const file = await files.findUnique(logoFileId)
      if (!file) {
        return NextResponse.json({ error: 'Not found', message: 'File not found' }, { status: 404 })
      }
      await settings.setBrandLogoFileId(logoFileId)
    } else {
      await settings.clearBrandLogo()
    }

    return NextResponse.json({ data: { logoFileId } })
  } catch (error) {
    console.error('Failed to update brand settings:', error)
    return NextResponse.json(
      { error: 'Failed to update brand settings', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
