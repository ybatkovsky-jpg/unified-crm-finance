"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarClockIcon } from "lucide-react"
import { ApiClientError } from "@/lib/api/shared"
import { previewRrule } from "@/lib/api/org"
import { buildRrule, parseRrule, type RruleFreq, type WeekdayCode } from "@/lib/org/rrule"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RruleBuilderProps {
  /** Текущая RFC-строка (null = пусто). */
  value: string | null
  /** Колбэк с новой RFC-строкой (или null для разовой задачи). */
  onChange: (rrule: string | null) => void
  /** Дата начала отсчёта (ISO). */
  dtStart: string
  /** until (ISO), опционально. */
  until?: string
  onUntilChange?: (iso: string | null) => void
}

const FREQ_LABELS: Record<RruleFreq, string> = {
  DAILY: "Ежедневно",
  WEEKLY: "Еженедельно",
  MONTHLY: "Ежемесячно",
  YEARLY: "Ежегодно",
}

const WEEKDAYS: { code: WeekdayCode; label: string }[] = [
  { code: "MO", label: "Пн" },
  { code: "TU", label: "Вт" },
  { code: "WE", label: "Ср" },
  { code: "TH", label: "Чт" },
  { code: "FR", label: "Пт" },
  { code: "SA", label: "Сб" },
  { code: "SU", label: "Вс" },
]

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

/**
 * RRULE-конструктор (упрощённый + расширенный режим). PLAT-06.
 *
 * Упрощённый: частота + интервал + день месяца/недели + until.
 * Расширенный: прямое редактирование RFC-строки.
 * Живой предпросмотр следующих 5 дат через /api/org/templates/preview.
 */
export function RruleBuilder({ value, onChange, dtStart, until, onUntilChange }: RruleBuilderProps) {
  const [advanced, setAdvanced] = useState(false)
  const [preview, setPreview] = useState<string[]>([])
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Парсим текущее значение в поля конструктора.
  const parsed = (() => {
    if (!value) return { freq: "MONTHLY" as RruleFreq, interval: 1, byDay: [] as WeekdayCode[], byMonthDay: [] as number[] }
    try {
      return parseRrule(value)
    } catch {
      return { freq: "MONTHLY" as RruleFreq, interval: 1, byDay: [] as WeekdayCode[], byMonthDay: [] as number[] }
    }
  })()

  const [freq, setFreq] = useState<RruleFreq>(parsed.freq)
  const [interval, setInterval] = useState<number>(parsed.interval)
  const [byDay, setByDay] = useState<WeekdayCode[]>(parsed.byDay ?? [])
  const [byMonthDay, setByMonthDay] = useState<number[]>(parsed.byMonthDay ?? [])
  const [rawText, setRawText] = useState(value ?? "")

  // Предпросмотр дат.
  const fetchPreview = useCallback(async () => {
    if (!value || !dtStart) { setPreview([]); setPreviewError(null); return }
    try {
      const { dates } = await previewRrule({ rrule: value, dtStart, count: 5 })
      setPreview(dates.map((d) => new Date(d).toLocaleDateString("ru-RU")))
      setPreviewError(null)
    } catch (e) {
      setPreview([])
      setPreviewError(e instanceof ApiClientError ? e.message : "Невалидное правило")
    }
  }, [value, dtStart])

  useEffect(() => { fetchPreview() }, [fetchPreview])

  const rebuild = (overrides: Partial<{ freq: RruleFreq; interval: number; byDay: WeekdayCode[]; byMonthDay: number[] }>) => {
    const next = { freq, interval, byDay, byMonthDay, ...overrides }
    try {
      const str = buildRrule({
        freq: next.freq,
        interval: next.interval > 1 ? next.interval : undefined,
        byDay: next.freq === "WEEKLY" && next.byDay.length > 0 ? next.byDay : undefined,
        byMonthDay: next.freq === "MONTHLY" && next.byMonthDay.length > 0 ? next.byMonthDay : undefined,
        until: until ? new Date(until) : null,
      })
      onChange(str)
      setRawText(str)
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Ошибка")
    }
  }

  const handleFreqChange = (f: RruleFreq) => { setFreq(f); rebuild({ freq: f }) }
  const handleIntervalChange = (n: number) => { setInterval(n); rebuild({ interval: n }) }

  const toggleWeekday = (code: WeekdayCode) => {
    const next = byDay.includes(code) ? byDay.filter((d) => d !== code) : [...byDay, code]
    next.sort((a, b) => WEEKDAYS.findIndex((w) => w.code === a) - WEEKDAYS.findIndex((w) => w.code === b))
    setByDay(next); rebuild({ byDay: next })
  }

  const handleMonthDay = (d: number) => { setByMonthDay([d]); rebuild({ byMonthDay: [d] }) }

  const handleRawApply = () => {
    const trimmed = rawText.trim()
    if (!trimmed) { onChange(null); return }
    try {
      const p = parseRrule(trimmed) // валидация
      onChange(trimmed)
      setFreq(p.freq); setInterval(p.interval); setByDay(p.byDay ?? []); setByMonthDay(p.byMonthDay ?? [])
      setAdvanced(false)
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Невалидный RRULE")
    }
  }

  const isOneTime = !value

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
      {/* Тип: разовая или повторяющаяся */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={isOneTime ? "default" : "outline"}
          onClick={() => { onChange(null); setRawText("") }}
        >
          Разовая задача
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!isOneTime ? "default" : "outline"}
          onClick={() => rebuild({})}
        >
          Повторяющаяся
        </Button>
        <div className="ml-auto">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setAdvanced((a) => !a)}
          >
            {advanced ? "Упрощённый режим" : "Расширенный режим"}
          </Button>
        </div>
      </div>

      {isOneTime ? (
        <p className="text-sm text-muted-foreground">
          Разовая задача создаст один инстанс на дату начала.
        </p>
      ) : advanced ? (
        <div className="space-y-2">
          <Label htmlFor="rrule-raw">RRULE (RFC 5545)</Label>
          <Input
            id="rrule-raw"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="FREQ=MONTHLY;BYMONTHDAY=25"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleRawApply())}
          />
          <Button type="button" size="sm" onClick={handleRawApply}>Применить</Button>
          <p className="text-xs text-muted-foreground">
            Примеры: <code>FREQ=MONTHLY;BYMONTHDAY=25</code> (каждое 25-е),&nbsp;
            <code>FREQ=WEEKLY;BYDAY=MO</code> (каждый понедельник),&nbsp;
            <code>FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=1</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Частота</Label>
            <Select value={freq} onValueChange={(v) => handleFreqChange(v as RruleFreq)} items={FREQ_LABELS}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(FREQ_LABELS) as RruleFreq[]).map((f) => (
                  <SelectItem key={f} value={f}>{FREQ_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rrule-interval">Каждые N</Label>
            <Input
              id="rrule-interval"
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => handleIntervalChange(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          {freq === "WEEKLY" && (
            <div className="md:col-span-2 space-y-1.5">
              <Label>Дни недели</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((wd) => (
                  <Button
                    key={wd.code}
                    type="button"
                    size="sm"
                    variant={byDay.includes(wd.code) ? "default" : "outline"}
                    onClick={() => toggleWeekday(wd.code)}
                  >
                    {wd.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {freq === "MONTHLY" && (
            <div className="md:col-span-2 space-y-1.5">
              <Label>День месяца</Label>
              <Select value={byMonthDay[0]?.toString()} onValueChange={(v) => handleMonthDay(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Выберите день" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {MONTH_DAYS.map((d) => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {onUntilChange && (
            <div className="space-y-1.5">
              <Label htmlFor="rrule-until">Повторять до (необязательно)</Label>
              <Input
                id="rrule-until"
                type="date"
                value={until ? until.slice(0, 10) : ""}
                onChange={(e) => {
                  onUntilChange(e.target.value ? new Date(e.target.value).toISOString() : null)
                  // Пересобрать с новым until.
                  setTimeout(() => rebuild({}), 0)
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Предпросмотр дат */}
      {!isOneTime && (
        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarClockIcon className="size-4" /> Ближайшие даты:
          </div>
          {previewError ? (
            <p className="text-sm text-destructive">{previewError}</p>
          ) : preview.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {preview.map((d, i) => <Badge key={i} variant="outline">{d}</Badge>)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Введите правило, чтобы увидеть даты.</p>
          )}
        </div>
      )}
    </div>
  )
}
