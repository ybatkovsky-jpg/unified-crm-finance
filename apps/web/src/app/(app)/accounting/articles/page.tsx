"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, TagsIcon, ExternalLinkIcon } from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Category {
  id: string
  name: string
  type: string
  order: number
  isActive: boolean
}

// Список 12 канонических названий статей постоянных расходов (ACCT-01, PRODUCT-SPEC п.6).
// Совпадение по имени с записанными в seed категориями.
const CANONICAL_ARTICLES = [
  "Аренда офиса",
  "Ведение бухгалтерии",
  "Зарплата — Ольга",
  "Зарплата — Марианна",
  "Зарплата — Юра",
  "Рекламный бюджет",
  "Офисные затраты",
  "Прочие расходы",
  "Налоги (УСН 15%)",
  "Электроэнергия, вода",
  "Интернет",
  "Телефон Мегафон",
]

export default function ArticlesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/categories?type=expense`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: Category[] }>(res)
      setCategories(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить статьи.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    )
  }

  if (error || !categories) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error || "Не удалось загрузить"}</p>
              <Button variant="outline" onClick={fetchArticles}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Разделяем: канонические 12 статей орг-расходов и прочие (проектные) статьи.
  const orgArticles = categories
    .filter((c) => CANONICAL_ARTICLES.includes(c.name))
    .sort((a, b) => a.order - b.order)
  const otherArticles = categories.filter((c) => !CANONICAL_ARTICLES.includes(c.name))
  const missingCanonical = CANONICAL_ARTICLES.filter(
    (name) => !categories.some((c) => c.name === name)
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <TagsIcon className="size-6" /> Статьи постоянных расходов
        </h1>
        <Link href="/finance/categories">
          <Button variant="outline" size="sm"><ExternalLinkIcon className="size-4" />Все категории</Button>
        </Link>
      </div>

      {missingCanonical.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Badge variant="destructive">нет в БД</Badge>
              <p className="text-sm">
                Не хватает {missingCanonical.length} канонических статей: {missingCanonical.join(", ")}.
                Запустите <code className="bg-muted px-1 rounded">npm run db:seed</code> для добавления.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium w-10">#</th>
                <th className="p-3 font-medium">Статья</th>
                <th className="p-3 font-medium text-right">Порядок</th>
                <th className="p-3 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {orgArticles.map((c, i) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 text-muted-foreground">{i + 1}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-right text-muted-foreground">{c.order}</td>
                  <td className="p-3 text-right">
                    <Link href={`/finance/categories/${c.id}`}>
                      <Button variant="ghost" size="sm">Изменить</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Справочник из 12 статей постоянных расходов организации (ACCT-01). Редактирование ведёт в раздел категорий финансов.
      </p>

      {otherArticles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Прочие статьи расходов (проектные)</h3>
            <div className="flex flex-wrap gap-2">
              {otherArticles.map((c) => (
                <Badge key={c.id} variant="outline">{c.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
