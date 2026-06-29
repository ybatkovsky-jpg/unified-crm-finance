import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/theme-provider"

export const metadata: Metadata = {
  title: "ПРО Мебель — ERP/CRM",
  description: "Единая система управления производством мебели",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
