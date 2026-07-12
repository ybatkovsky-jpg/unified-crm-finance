"use client"

import { useState, useEffect, useCallback } from "react"
import { Upload, Loader2, FileText, Check, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ApiClientError, parseJson } from "@/lib/api/shared"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface StatementListItem {
  id: string
  statementDate: string
  accountNumber: string | null
  totalIncome: number
  totalExpense: number
  status: string
  _count?: { BankTransaction: number }
}

interface BankTransactionRow {
  id: string
  transactionDate: string
  amount: number
  direction: string
  counterpartyName: string | null
  counterpartyInn: string | null
  paymentPurpose: string | null
  matchingStatus: string
}

interface StatementDetail extends StatementListItem {
  BankTransaction: BankTransactionRow[]
}

interface ProjectOption { id: string; name: string; externalNumber: string }

function formatRub(n: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n)
}

const MATCH_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  matched: "secondary",
  unmatched: "outline",
  ignored: "destructive",
}

export default function BankStatementsPage() {
  const [statements, setStatements] = useState<StatementListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<StatementDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchSummary, setMatchSummary] = useState<string | null>(null)
  const [confirmFor, setConfirmFor] = useState<BankTransactionRow | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [confirmProject, setConfirmProject] = useState<string>("")
  const [confirming, setConfirming] = useState(false)

  const fetchStatements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/finance/statements", { headers: { "Content-Type": "application/json" } })
      if (!res.ok) throw new Error("Не удалось загрузить выписки")
      const json = await parseJson<{ data: StatementListItem[] }>(res)
      setStatements(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatements()
    // Загрузить список проектов для ручного сопоставления.
    fetch("/api/projects?take=100", { headers: { "Content-Type": "application/json" } })
      .then((r) => r.json())
      .then((d) => setProjects(d.data ?? []))
      .catch(() => {})
  }, [fetchStatements])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/finance/statements/import", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || json.error || "Ошибка импорта")
      }
      setUploadMsg(
        `Импортировано: ${json.parsed.transactionsCount} транзакций, ` +
        `приход ${formatRub(json.parsed.totalIncome)}, расход ${formatRub(json.parsed.totalExpense)}`
      )
      await fetchStatements()
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : "Ошибка импорта")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const openDetail = async (id: string) => {
    setSelectedId(id)
    setDetailLoading(true)
    setMatchSummary(null)
    try {
      const res = await fetch(`/api/finance/statements/${id}`, { headers: { "Content-Type": "application/json" } })
      const json = await res.json()
      setDetail(json.data)
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleMatch = async () => {
    if (!selectedId) return
    setMatching(true)
    setMatchSummary(null)
    try {
      const res = await fetch(`/api/finance/statements/${selectedId}/match`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Ошибка сверки")
      setMatchSummary(
        `Сверено: ${json.data.matched} сопоставлено, ${json.data.unmatched} требуют ручного подтверждения (из ${json.data.total})`
      )
      await openDetail(selectedId)
    } catch (err) {
      setMatchSummary(err instanceof Error ? err.message : "Ошибка сверки")
    } finally {
      setMatching(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmFor) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/finance/bank-transactions/${confirmFor.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: confirmProject || undefined }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.message || "Ошибка подтверждения")
      }
      setConfirmFor(null)
      setConfirmProject("")
      if (selectedId) await openDetail(selectedId)
    } catch {
      // ignore
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Банк-выписки</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Импорт выписки 1C/TXT и сверка платежей с проектами/счетами
          </p>
        </div>
        <div>
          <Button variant="outline" render={
            <a href="/finance"><ArrowLeft className="size-4 mr-1" />К финансам</a>
          } />
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6"><p className="text-destructive">{error}</p></CardContent>
        </Card>
      )}

      {/* Загрузка файла */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-4" /> Импорт выписки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <input
              type="file"
              accept=".txt,.1c,.csv,text/plain"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm"
            />
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Импорт…
            </div>
          )}
          {uploadMsg && (
            <div className="flex items-start gap-2 text-sm">
              <Check className="size-4 text-green-600 mt-0.5 shrink-0" />
              <span>{uploadMsg}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Поддерживается формат 1C Client-Bank и текстовые выгрузки (Тинькофф, Озон).
            Приходные платежи сверяются с контрагентами/счетами по ИНН и сумме.
          </p>
        </CardContent>
      </Card>

      {/* Список выписок */}
      <Card>
        <CardHeader><CardTitle>Выписки</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : statements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Выписок пока нет</p>
            </div>
          ) : (
            <div className="space-y-2">
              {statements.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openDetail(s.id)}
                  className="w-full flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(s.statementDate).toLocaleDateString("ru-RU")}
                      {s.accountNumber && <span className="text-muted-foreground ml-2">• {s.accountNumber}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s._count?.BankTransaction ?? 0} транзакций
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-600">+{formatRub(s.totalIncome)}</span>
                    <span className="text-red-600">−{formatRub(s.totalExpense)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Детали выписки + сверка */}
      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Транзакции выписки</span>
              <Button size="sm" onClick={handleMatch} disabled={matching || detailLoading}>
                <Sparkles className="size-3 mr-1" />
                {matching ? "Сверка…" : "Авто-сверка"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchSummary && (
              <div className="flex items-start gap-2 text-sm rounded-lg bg-muted/50 p-3">
                <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <span>{matchSummary}</span>
              </div>
            )}
            {detailLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
            ) : detail && detail.BankTransaction.length > 0 ? (
              <div className="space-y-2">
                {detail.BankTransaction.map((bt) => (
                  <div key={bt.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatRub(bt.amount)}</span>
                        <Badge variant={bt.direction === "incoming" ? "default" : "outline"}>
                          {bt.direction === "incoming" ? "Приход" : "Расход"}
                        </Badge>
                        <Badge variant={MATCH_VARIANTS[bt.matchingStatus] || "outline"}>
                          {bt.matchingStatus === "matched" ? "Сопоставлено" :
                           bt.matchingStatus === "unmatched" ? "Не сверено" : bt.matchingStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bt.transactionDate).toLocaleDateString("ru-RU")}
                        {bt.counterpartyName && ` • ${bt.counterpartyName}`}
                        {bt.counterpartyInn && ` • ИНН ${bt.counterpartyInn}`}
                      </p>
                      {bt.paymentPurpose && (
                        <p className="text-xs text-muted-foreground">{bt.paymentPurpose}</p>
                      )}
                    </div>
                    {bt.matchingStatus === "unmatched" && bt.direction === "incoming" && (
                      <Button size="sm" variant="outline" onClick={() => { setConfirmFor(bt); setConfirmProject("") }}>
                        Сопоставить
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Нет транзакций</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Диалог ручного сопоставления */}
      <Dialog open={confirmFor !== null} onOpenChange={(o) => !o && setConfirmFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сопоставить платёж</DialogTitle>
            <DialogDescription>
              {confirmFor && `${formatRub(confirmFor.amount)} — ${confirmFor.counterpartyName ?? "контрагент неизвестен"}`}
              {confirmFor?.paymentPurpose && `. Назначение: ${confirmFor.paymentPurpose}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label>Привязать к проекту</Label>
            <Select
              value={confirmProject || "__none__"}
              onValueChange={(v) => setConfirmProject(v === "__none__" ? "" : v ?? "")}
              items={Object.fromEntries([
                ["__none__", "Без проекта"],
                ...projects.map((p) => [p.id, `${p.externalNumber} — ${p.name}`]),
              ])}
            >
              <SelectTrigger><SelectValue placeholder="Без проекта" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Без проекта</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.externalNumber} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFor(null)}>Отмена</Button>
            <Button onClick={handleConfirm} disabled={confirming}>
              {confirming ? "Сохранение…" : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
