"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * Inner login form. Extracted so `useSearchParams()` runs inside a Suspense
 * boundary — required by Next for pages that can be statically prerendered.
 */
function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("admin@local")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Ошибка входа")
        setLoading(false)
        return
      }
      const next = params.get("next") || "/"
      router.push(next)
      router.refresh()
    } catch {
      setError("Сеть недоступна")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 bg-background border rounded-xl p-8 shadow-sm"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">ПРО Мебель</h1>
          <p className="text-sm text-muted-foreground">Вход в систему управления</p>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2 text-center">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Вход…" : "Войти"}
        </button>

        <p className="text-xs text-center text-muted-foreground">
          Первый вход: admin@local / admin123
        </p>
      </form>
    </div>
  )
}

/**
 * Default export — wraps the form in a Suspense boundary so the page can be
 * statically prerendered despite `useSearchParams()` usage.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
