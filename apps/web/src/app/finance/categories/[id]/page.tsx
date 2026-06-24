"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { RefreshCwIcon, ArrowLeftIcon, PencilIcon, Trash2Icon, ChevronRightIcon } from "lucide-react"

import { categoriesApi, ApiClientError } from "@/lib/api/categories"
import type { CategoryData } from "@/lib/api/types"
import { CategoryForm } from "@/components/finance/category-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CategoryDetailPage({ params }: { params: { id: string } }) {
  const categoryId = params.id
  const [category, setCategory] = useState<CategoryData | null>(null)
  const [allCategories, setAllCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all categories (including inactive) so we can find children + parent name
      const response = await categoriesApi.getCategories({ includeInactive: true })
      setAllCategories(response.data)

      const found = response.data.find((c) => c.id === categoryId)
      if (found) {
        setCategory(found)
      } else {
        setError("Category not found")
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to load category. Please try again.")
      }
      console.error("Category fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRetry = () => {
    fetchData()
  }

  const handleDelete = async () => {
    if (!category) return
    if (!window.confirm(`Deactivate category "${category.name}"?`)) return

    setDeleting(true)
    try {
      await categoriesApi.deleteCategory(category.id)
      // Refresh to show updated state
      fetchData()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to delete category.")
      }
    } finally {
      setDeleting(false)
    }
  }

  // Derived: children of this category
  const children = useMemo(() => {
    if (!category) return []
    return allCategories.filter((c) => c.parentId === category.id)
  }, [category, allCategories])

  // Derived: parent name
  const parentName = useMemo(() => {
    if (!category?.parentId) return null
    const parent = allCategories.find((c) => c.id === category.parentId)
    return parent?.name ?? null
  }, [category, allCategories])

  // Derived: ancestry chain for breadcrumb
  const ancestry = useMemo(() => {
    if (!category) return []
    const chain: CategoryData[] = []
    const visited = new Set<string>()
    let currentId: string | null = category.parentId
    while (currentId) {
      if (visited.has(currentId)) break // safety: cycle guard
      visited.add(currentId)
      const parent = allCategories.find((c) => c.id === currentId)
      if (parent) {
        chain.unshift(parent)
        currentId = parent.parentId ?? null
      } else {
        break
      }
    }
    return chain
  }, [category, allCategories])

  const formatDate = (dateStr: string | Date): string => {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr
    return d.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderTypeBadge = (type: string) => (
    <Badge variant={type === "income" ? "default" : "secondary"}>
      {type === "income" ? "Income" : "Expense"}
    </Badge>
  )

  const renderStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "outline"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  )

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading category...</span>
        </div>
      </div>
    )
  }

  // ── Error / not found state ───────────────────────────────────
  if (error || !category) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error || "Category not found"}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCwIcon className="size-4" />
                  <span className="ml-1.5">Retry</span>
                </Button>
                <Link href="/finance/categories">
                  <Button variant="outline">
                    <ArrowLeftIcon className="size-4" />
                    <span className="ml-1.5">Back to Categories</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main content ──────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/finance/categories" className="hover:text-primary transition-colors">
          Categories
        </Link>
        {ancestry.map((ancestor) => (
          <span key={ancestor.id} className="flex items-center gap-1.5">
            <ChevronRightIcon className="size-3.5" />
            <Link
              href={`/finance/categories/${ancestor.id}`}
              className="hover:text-primary transition-colors"
            >
              {ancestor.name}
            </Link>
          </span>
        ))}
        <ChevronRightIcon className="size-3.5" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Back navigation */}
      <Link
        href="/finance/categories"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeftIcon className="size-4 mr-1" />
        Back to Categories
      </Link>

      {/* Category details card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl">{category.name}</CardTitle>
              <div className="flex items-center gap-2">
                {renderTypeBadge(category.type)}
                {renderStatusBadge(category.isActive)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <PencilIcon className="size-4" />
                <span className="ml-1.5">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting || !category.isActive}
                title={category.isActive ? "Deactivate" : "Already inactive"}
              >
                <Trash2Icon className="size-4" />
                <span className="ml-1.5">{deleting ? "Deleting..." : "Deactivate"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Type:</span>
              {renderTypeBadge(category.type)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              {renderStatusBadge(category.isActive)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Parent:</span>
              <span>
                {parentName ? (
                  <Link
                    href={`/finance/categories/${category.parentId}`}
                    className="hover:text-primary underline underline-offset-2"
                  >
                    {parentName}
                  </Link>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Order:</span>
              <span>{category.order}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(category.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Updated:</span>
              <span>{formatDate(category.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child categories card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Child Categories
            {children.length > 0 && (
              <span className="ml-2 text-muted-foreground text-sm font-normal">
                ({children.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No child categories</p>
          ) : (
            <div className="space-y-1">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/finance/categories/${child.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.name}</span>
                    {renderTypeBadge(child.type)}
                    {renderStatusBadge(child.isActive)}
                  </div>
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      <CategoryForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          setEditOpen(false)
          fetchData()
        }}
        category={category}
      />
    </div>
  )
}
