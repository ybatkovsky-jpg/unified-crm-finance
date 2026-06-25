"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { RefreshCwIcon, ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { transactionsApi, ApiClientError } from "@/lib/api/transactions"
import type { TransactionData } from "@/lib/api/types"
import { TransactionForm } from "@/components/finance/transaction-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(amount)
}

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: txId } = use(params)
  const [transaction, setTransaction] = useState<TransactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchTransaction = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await transactionsApi.getTransaction(txId)
      setTransaction(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 404) setError("Transaction not found")
        else setError(err.message)
      } else {
        setError("Failed to load transaction.")
      }
    } finally {
      setLoading(false)
    }
  }, [txId])

  useEffect(() => { fetchTransaction() }, [fetchTransaction])

  const handleDelete = async () => {
    if (!transaction) return
    if (!window.confirm(`Delete transaction "${transaction.description || transaction.id}"?`)) return
    setDeleting(true)
    try {
      await transactionsApi.deleteTransaction(transaction.id)
      fetchTransaction()
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message)
      else setError("Failed to delete transaction.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading transaction...</span>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error || "Transaction not found"}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={fetchTransaction}>
                  <RefreshCwIcon className="size-4" />
                  <span className="ml-1.5">Retry</span>
                </Button>
                <Link href="/finance/transactions">
                  <Button variant="outline">
                    <ArrowLeftIcon className="size-4" />
                    <span className="ml-1.5">Back to Transactions</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Link href="/finance/transactions" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeftIcon className="size-4 mr-1" />
        Back to Transactions
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl">
                {transaction.description || `Transaction ${transaction.id.slice(0, 8)}`}
              </CardTitle>
              <div className="flex items-center gap-2">
                {renderTypeBadge(transaction.type)}
                {renderStatusBadge(transaction.status)}
                <Badge variant="outline">{transaction.source}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <PencilIcon className="size-4" />
                <span className="ml-1.5">Edit</span>
              </Button>
              <Button
                variant="outline" size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2Icon className="size-4" />
                <span className="ml-1.5">{deleting ? "Deleting..." : "Delete"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Category:</span>
              <span>{transaction.Category?.name ?? transaction.categoryId}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Type:</span>
              {renderTypeBadge(transaction.type)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              {renderStatusBadge(transaction.status)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Source:</span>
              <span>{transaction.source}</span>
            </div>
            {transaction.Project && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Project:</span>
                <Link href={`/projects/${transaction.projectId}`} className="text-primary hover:underline">
                  {transaction.Project.name}
                </Link>
              </div>
            )}
            {transaction.Counterparty && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Counterparty:</span>
                <span>{transaction.Counterparty.name}</span>
              </div>
            )}
            {transaction.Invoice && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Invoice:</span>
                <span>#{transaction.Invoice.number}</span>
              </div>
            )}
            {transaction.externalId && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">External ID:</span>
                <span className="font-mono text-xs">{transaction.externalId}</span>
              </div>
            )}
          </div>

          <div className="mt-6 text-sm text-muted-foreground space-y-1">
            <div>Created: {formatDate(transaction.createdAt)}</div>
            <div>Updated: {formatDate(transaction.updatedAt)}</div>
            {transaction.deletedAt && (
              <div className="text-destructive">Deleted: {formatDate(transaction.deletedAt)}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); fetchTransaction() }}
        transaction={transaction}
      />
    </div>
  )
}
