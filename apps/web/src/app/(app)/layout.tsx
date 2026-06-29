import { AppShell } from "@/components/layout/app-shell"

/**
 * Layout for the authenticated app surface. All business pages live under this
 * route group (so the URL is unchanged) and inherit the sidebar + topbar shell.
 * `/login` and `/` are intentionally outside this group and render without it.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
