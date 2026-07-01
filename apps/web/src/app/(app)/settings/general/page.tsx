"use client"

import { useState, useEffect, useCallback } from "react"
import { Image as ImageIcon, Trash2, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload, type FileUploadFile } from "@/components/shared/file-upload"

interface BrandData {
  logoFileId: string | null
  logoUrl: string | null
  fileName: string | null
}

export default function GeneralSettingsPage() {
  const [brand, setBrand] = useState<BrandData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchBrand = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/settings/brand")
      if (!res.ok) throw new Error("Не удалось загрузить настройки")
      const json = await res.json()
      setBrand(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить настройки")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBrand()
  }, [fetchBrand])

  const handleUpload = async (fileItem: FileUploadFile) => {
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      // 1. Загрузить файл через /api/files
      const formData = new FormData()
      formData.append("file", fileItem.file)
      formData.append("entityType", "brand")
      formData.append("entityId", "logo")

      const uploadRes = await fetch("/api/files", { method: "POST", body: formData })
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}))
        throw new Error(errData.message || "Не удалось загрузить файл")
      }
      const { data: fileData } = await uploadRes.json()

      // 2. Сохранить как логотип
      const brandRes = await fetch("/api/settings/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoFileId: fileData.id }),
      })
      if (!brandRes.ok) throw new Error("Не удалось сохранить логотип")

      setSuccess("Логотип обновлён")
      await fetchBrand()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить логотип")
      throw err
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!brand?.logoFileId) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/settings/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoFileId: null }),
      })
      if (!res.ok) throw new Error("Не удалось удалить логотип")
      setSuccess("Логотип удалён")
      await fetchBrand()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить логотип")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Общие настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Настройки бренда и внешний вид приложения
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
      {success && (
        <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-4" />
            Логотип компании
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Загрузка…
            </div>
          ) : brand?.logoUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center rounded-xl border bg-card p-2">
                  <img
                    src={brand.logoUrl}
                    alt="Логотип"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{brand.fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Логотип отображается в боковом меню
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  <Trash2 className="size-3.5" />
                  <span className="ml-1.5">Удалить</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Загрузите логотип компании. Он будет отображаться в боковом меню вместо иконки по умолчанию.
              </p>
              <FileUpload
                accept="image/*"
                multiple={false}
                maxFiles={1}
                onUpload={handleUpload}
                disabled={uploading}
              />
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {brand?.logoUrl ? "Обработка…" : "Загрузка…"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
