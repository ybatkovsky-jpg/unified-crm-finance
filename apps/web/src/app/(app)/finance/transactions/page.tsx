"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, PencilIcon, Trash2Icon, ChevronRightIcon } from "lucide-react"

import { transactionsApi, ApiClientError } from "@/lib/api/transactions"
import type { TransactionData, TransactionListParams } from "@/lib/api/types"
import { TransactionForm } from "@/components/finance/transaction-form"
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

type TypeFilter = "all" | "income" | "expense"
type StatusFilter = "all" | "confirmed" | "pending"

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU")
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(amount)
}

export default function TransactionListPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTransactions = useCallback(async (type: TypeFilter, status: StatusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params: TransactionListParams = {}
      if (type !== "all") params.type = type
      if (status !== "all") params.status = status

      const response = await transactionsApi.getTransactions(
        Object.keys(params).length > 0 ? params : undefined
      )
      setTransactions(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to load transactions.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions(typeFilter, statusFilter)
  }, [typeFilter, statusFilter, fetchTransactions])

  const handleDelete = async (tx: TransactionData) => {
    if (!window.confirm(`Delete transaction "${tx.description || tx.id}"?`)) return
    setDeletingId(tx.id)
    try {
      await transactionsApi.deleteTransaction(tx.id)
      fetchTransactions(typeFilter, statusFilter)
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message)
      else setError("Failed to delete transaction.")
    } finally {
      setDeletingId(null)
    }
  }

  const renderTypeBadge = (type: string) => (
    <Badge variant={type === "income" ? "default" : "secondary"}>
      {type === "income" ? "Income" : "Expense"}
    </Badge>
  )

  const renderStatusBadge = (status: string) => (
    <Badge variant={status === "confirmed" ? "default" : "outline"}>
      {status === "confirmed" ? "Confirmed" : "Pending"}
    </Badge>
  )

  const incomeTotal = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0)
  const expenseTotal = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button onClick={() => setCreateOpen(true)}>Create</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(incomeTotal)}</div>
            <div className="text-sm text-muted-foreground">Income</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(expenseTotal)}</div>
            <div className="text-sm text-muted-foreground">Expense</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className={`text-2xl font-bold ${incomeTotal - expenseTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(incomeTotal - expenseTotal)}
            </div>
            <div className="text-sm text-muted-foreground">Balance</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select value={typeFilter} onValueChange={(v) => { if (v) setTypeFilter(v as TypeFilter) }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v as StatusFilter) }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading transactions...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => fetchTransactions(typeFilter, statusFilter)}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && transactions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">No transactions found</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Link
                      href={`/finance/transactions/${tx.id}`}
                      className="text-primary hover:underline"
                    >
                      {formatDate(tx.date)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {tx.description || "—"}
                  </TableCell>
                  <TableCell>{tx.Category?.name ?? tx.categoryId}</TableCell>
                  <TableCell>{renderTypeBadge(tx.type)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(tx.amount))}
                  </TableCell>
                  <TableCell>{renderStatusBadge(tx.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingTx(tx)} title="Edit">
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tx)} disabled={deletingId === tx.id} title="Delete"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                      <Link href={`/finance/transactions/${tx.id}`}>
                        <Button variant="ghost" size="icon" className="size-8" title="View">
                          <ChevronRightIcon className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TransactionForm open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => { setCreateOpen(false); fetchTransactions(typeFilter, statusFilter) }} />
      <TransactionForm open={!!editingTx} onOpenChange={(open) => { if (!open) setEditingTx(null) }} onSuccess={() => { setEditingTx(null); fetchTransactions(typeFilter, statusFilter) }} transaction={editingTx} />
    </div>
  )
}
