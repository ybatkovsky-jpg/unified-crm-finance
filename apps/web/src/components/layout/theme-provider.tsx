"use client"

/**
 * Theme provider for light/dark mode via next-themes.
 *
 * `suppressHydrationWarning` is required on <html> because next-themes sets the
 * `class` attribute on the client before React hydrates — without it React
 * warns about the className mismatch on first paint.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
