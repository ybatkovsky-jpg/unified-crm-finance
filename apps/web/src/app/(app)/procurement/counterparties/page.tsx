"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { counterpartiesApi, ApiClientError } from "@/lib/api/counterparties"
import type { CounterpartyData } from "@/lib/api/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CounterpartyForm } from "@/components/procurement/counterparty-form"

type TypeFilter = "all" | "supplier"

export default function CounterpartyListPage() {
  const [counterparties, setCounterparties] = useState<CounterpartyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchCounterparties = useCallback(async (type: TypeFilter, search: string) => {
    setLoading(true)
    setError(null)
    try {
      const params: { type?: string; search?: string } = {}
      if (type !== "all") params.type = type
      if (search) params.search = search

      const response = await counterpartiesApi.getCounterparties(
        Object.keys(params).length > 0 ? params : undefined
      )
      setCounterparties(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to load counterparties. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCounterparties(typeFilter, debouncedSearch)
  }, [typeFilter, debouncedSearch, fetchCounterparties])

  const handleRetry = () => {
    fetchCounterparties(typeFilter, debouncedSearch)
  }

  const renderRating = (rating: number | null | undefined) => {
    if (rating == null) return "\—"
    return "\★ ".repeat(rating).trim()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Counterparties</h1>
        <Button onClick={() => setCreateOpen(true)}>Create</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  if (value) setTypeFilter(value as TypeFilter)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm text-muted-foreground">Search</label>
              <Input
                placeholder="Search by name or INN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading counterparties...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && counterparties.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No counterparties found
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && counterparties.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>INN</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counterparties.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell>
                    <Link
                      href={`/procurement/counterparties/${cp.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {cp.name}
                    </Link>
                  </TableCell>
                  <TableCell>{cp.inn || "\—"}</TableCell>
                  <TableCell>{cp.phone || "\—"}</TableCell>
                  <TableCell>{cp.email || "\—"}</TableCell>
                  <TableCell>{renderRating(cp.rating)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        cp.type === "supplier" ? "secondary" : "default"
                      }
                    >
                      {cp.type === "supplier" ? "Supplier" : "Customer"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CounterpartyForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false)
          fetchCounterparties(typeFilter, debouncedSearch)
        }}
      />
    </div>
  )
}
