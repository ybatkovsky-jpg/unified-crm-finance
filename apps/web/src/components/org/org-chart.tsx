"use client"

/**
 * Визуальная схема орг-структуры: отделы → функции → назначения (head/responsible).
 * CSS-дерево с коннекторами без внешних библиотек.
 */
import { Building2, Users, Crown, UserRound } from "lucide-react"
import type { DepartmentData, FunctionData } from "@/lib/api/org"

function NodeCard({
  label,
  subtitle,
  kind,
}: {
  label: string
  subtitle?: string
  kind: "root" | "dept" | "fn" | "head" | "responsible"
}) {
  const styles: Record<string, string> = {
    root: "bg-primary text-primary-foreground border-primary",
    dept: "bg-card border-2 border-primary/40",
    fn: "bg-muted/40 border",
    head: "bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800",
    responsible: "bg-card border",
  }
  const Icon =
    kind === "root" ? Building2 :
    kind === "dept" ? Building2 :
    kind === "fn" ? Users :
    kind === "head" ? Crown : UserRound

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm ${styles[kind]}`}
    >
      <Icon className={`size-4 shrink-0 ${kind === "head" ? "text-amber-600" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <div className="font-medium leading-tight truncate">{label}</div>
        {subtitle && <div className="text-[10px] text-muted-foreground leading-tight">{subtitle}</div>}
      </div>
    </div>
  )
}

/** Вертикальный коннектор (линия вниз). */
function VLine() {
  return <div className="w-px h-5 bg-border mx-auto" />
}

export function OrgChart({
  departments,
  functions,
}: {
  departments: DepartmentData[]
  functions: FunctionData[]
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-max px-4">
        {/* Root */}
        <div className="flex flex-col items-center">
          <NodeCard label="ПРО Мебель" subtitle="Орг-структура" kind="root" />
          <VLine />

          {/* Departments */}
          <div className="flex items-start gap-6">
            {departments.map((dept) => {
              const fns = functions.filter((f) => f.departmentId === dept.id)
              return (
                <div key={dept.id} className="flex flex-col items-center">
                  {/* Горизонтальный коннектор к отделу */}
                  <div className="h-5 w-px bg-border" />
                  <NodeCard label={dept.name} kind="dept" />

                  {fns.length > 0 && (
                    <>
                      <div className="w-px h-4 bg-border" />
                      {/* Горизонтальная шина под отделом */}
                      <div className="flex gap-4 items-start">
                        {fns.map((fn) => {
                          const heads = (fn.FunctionAssignment ?? []).filter((a) => a.role === "head")
                          const resp = (fn.FunctionAssignment ?? []).filter((a) => a.role === "responsible")
                          return (
                            <div key={fn.id} className="flex flex-col items-center">
                              <div className="h-4 w-px bg-border" />
                              <NodeCard label={fn.name} kind="fn" />

                              {(heads.length > 0 || resp.length > 0) && (
                                <>
                                  <div className="w-px h-3 bg-border" />
                                  <div className="flex flex-col gap-1.5 items-stretch">
                                    {heads.map((a) => (
                                      <div key={a.id} className="flex flex-col items-center">
                                        <NodeCard label={a.User.name || a.User.email} subtitle="Руководитель" kind="head" />
                                      </div>
                                    ))}
                                    {resp.map((a) => (
                                      <div key={a.id} className="flex flex-col items-center">
                                        <NodeCard label={a.User.name || a.User.email} subtitle="Ответственный" kind="responsible" />
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
