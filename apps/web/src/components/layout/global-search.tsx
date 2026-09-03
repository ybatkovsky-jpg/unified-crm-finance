"use client"

/**
 * Глобальный поиск (UI-02): поиск по сделкам, контактам, проектам и договорам
 * с выпадающей выдачей и переходом по Enter/клику.
 */
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Search, Handshake, Contact, FolderKanban, FileText } from "lucide-react"

import { Input } from "@/components/ui/input"

interface SearchResult {
  id: string
  title?: string
  number?: string
  name?: string
  firstName?: string
  lastName?: string
  companyName?: string
  type?: string
  externalNumber?: string
  amount?: number
  currency?: string
}

interface SearchData {
  deals: SearchResult[]
  contacts: SearchResult[]
  projects: SearchResult[]
  contracts: SearchResult[]
}

function contactLabel(c: SearchResult): string {
  if (c.type === "company") return c.companyName || "—"
  return [c.lastName, c.firstName].filter(Boolean).join(" ") || "—"
}

export function GlobalSearch() {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<SearchData | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(async (query: string) => {
    const term = query.trim()
    if (!term) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`)
      if (res.ok) {
        const json = await res.json()
        setResults(json.data)
      }
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => runSearch(q), 300)
    return () => clearTimeout(t)
  }, [q, runSearch])

  // Close on outside click / Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", key)
    }
  }, [])

  const total =
    results
      ? results.deals.length + results.contacts.length + results.projects.length + results.contracts.length
      : 0

  const hasResults = results && total > 0

  return (
    <div ref={boxRef} className="relative hidden md:block w-full max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Поиск: сделка, контакт, проект…"
        className="pl-8 h-8 text-sm"
        aria-label="Глобальный поиск"
      />

      {open && q.trim() && (
        <div className="absolute top-full mt-1.5 w-full rounded-lg border bg-popover shadow-lg z-50 overflow-hidden">
          {loading && (
            <div className="p-3 text-xs text-muted-foreground">Поиск…</div>
          )}

          {!loading && !hasResults && (
            <div className="p-3 text-sm text-muted-foreground">Ничего не найдено</div>
          )}

          {!loading && hasResults && (
            <div className="max-h-80 overflow-y-auto">
              {results!.deals.length > 0 && (
                <Group label="Сделки">
                  {results!.deals.map((d) => (
                    <ResultLink key={d.id} href={`/deals/${d.id}`} icon={Handshake}>
                      <span className="truncate">{d.title}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{d.number}</span>
                    </ResultLink>
                  ))}
                </Group>
              )}
              {results!.contacts.length > 0 && (
                <Group label="Контакты">
                  {results!.contacts.map((c) => (
                    <ResultLink key={c.id} href={`/crm/contacts/${c.id}`} icon={Contact}>
                      <span className="truncate">{contactLabel(c)}</span>
                      <span className="text-[10px] text-muted-foreground">{c.type === "company" ? "Юр" : "Физ"}</span>
                    </ResultLink>
                  ))}
                </Group>
              )}
              {results!.projects.length > 0 && (
                <Group label="Проекты">
                  {results!.projects.map((p) => (
                    <ResultLink key={p.id} href={`/projects/${p.id}`} icon={FolderKanban}>
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{p.externalNumber}</span>
                    </ResultLink>
                  ))}
                </Group>
              )}
              {results!.contracts.length > 0 && (
                <Group label="Договоры">
                  {results!.contracts.map((c) => (
                    <ResultLink key={c.id} href={`/contracts/${c.id}`} icon={FileText}>
                      <span className="truncate">{c.title}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{c.number}</span>
                    </ResultLink>
                  ))}
                </Group>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b last:border-b-0">
      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function ResultLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-sm transition-colors"
    >
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="flex-1 min-w-0 flex items-center gap-2">{children}</span>
    </Link>
  )
}
