"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, ArrowLeftIcon, StarIcon, Building2Icon, BanknoteIcon, FileTextIcon } from "lucide-react"

import { counterpartiesApi, ApiClientError } from "@/lib/api/counterparties"
import type { CounterpartyData } from "@/lib/api/types"
import { CounterpartyHistory } from "@/components/procurement/counterparty-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CounterpartyDetailPage({ params }: { params: { id: string } }) {
  const counterpartyId = params.id
  const [counterparty, setCounterparty] = useState<CounterpartyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  const fetchCounterparty = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await counterpartiesApi.getCounterparty(counterpartyId)
      setCounterparty(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 404) {
          setError("Counterparty not found")
        } else {
          setError(err.message)
        }
      } else {
        setError("Failed to load counterparty. Please try again.")
      }
      console.error("Counterparty fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [counterpartyId])

  useEffect(() => {
    fetchCounterparty()
  }, [fetchCounterparty])

  const handleRetry = () => {
    fetchCounterparty()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading counterparty...</span>
        </div>
      </div>
    )
  }

  if (error || !counterparty) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error || "Counterparty not found"}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCwIcon className="size-4" />
                  <span className="ml-1.5">Retry</span>
                </Button>
                <Link href="/procurement/counterparties">
                  <Button variant="outline">
                    <ArrowLeftIcon className="size-4" />
                    <span className="ml-1.5">Back to Counterparties</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasBankDetails = counterparty.bankName || counterparty.bankAccount || counterparty.korAccount || counterparty.bik

  const detailsTabContent = (
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2Icon className="size-5 text-muted-foreground" />
                <CardTitle className="text-2xl">{counterparty.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={counterparty.type === "supplier" ? "secondary" : "default"}
                >
                  {counterparty.type === "supplier" ? "Supplier" : "Customer"}
                </Badge>
                {counterparty.rating != null && (
                  <div className="flex items-center gap-1 text-sm">
                    <StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
                    <span>{counterparty.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {counterparty.inn && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">INN:</span>
                <span>{counterparty.inn}</span>
              </div>
            )}
            {counterparty.kpp && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">KPP:</span>
                <span>{counterparty.kpp}</span>
              </div>
            )}
            {counterparty.email && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span>{counterparty.email}</span>
              </div>
            )}
            {counterparty.phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span>{counterparty.phone}</span>
              </div>
            )}
            {counterparty.contactPerson && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Contact Person:</span>
                <span>{counterparty.contactPerson}</span>
              </div>
            )}
            {counterparty.address && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span>{counterparty.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank details card */}
      {hasBankDetails && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BanknoteIcon className="size-5 text-muted-foreground" />
              <CardTitle>Bank Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {counterparty.bankName && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span>{counterparty.bankName}</span>
                </div>
              )}
              {counterparty.bankAccount && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Account:</span>
                  <span>{counterparty.bankAccount}</span>
                </div>
              )}
              {counterparty.korAccount && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Kor Account:</span>
                  <span>{counterparty.korAccount}</span>
                </div>
              )}
              {counterparty.bik && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">BIK:</span>
                  <span>{counterparty.bik}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes section */}
      {counterparty.notes && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileTextIcon className="size-5 text-muted-foreground" />
              <CardTitle>Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{counterparty.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const purchaseRequestColumns = [
    { key: "id", header: "ID" },
    { key: "title", header: "Title" },
    { key: "status", header: "Status" },
    { key: "amount", header: "Amount" },
    { key: "createdAt", header: "Created" },
  ]

  const invoiceColumns = [
    { key: "id", header: "ID" },
    { key: "number", header: "Number" },
    { key: "status", header: "Status" },
    { key: "amount", header: "Amount" },
    { key: "dueDate", header: "Due Date" },
  ]

  const deliveryColumns = [
    { key: "id", header: "ID" },
    { key: "date", header: "Date" },
    { key: "status", header: "Status" },
    { key: "items", header: "Items" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <Link href="/procurement/counterparties" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeftIcon className="size-4 mr-1" />
        Back to Counterparties
      </Link>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="purchase-requests">Purchase Requests</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          {detailsTabContent}
        </TabsContent>

        <TabsContent value="purchase-requests">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <CounterpartyHistory
                data={[]}
                columns={purchaseRequestColumns}
                emptyMessage="No purchase requests yet"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <CounterpartyHistory
                data={[]}
                columns={invoiceColumns}
                emptyMessage="No invoices yet"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <CounterpartyHistory
                data={[]}
                columns={deliveryColumns}
                emptyMessage="No deliveries yet"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
